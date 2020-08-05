import { mapValues } from "lodash-es";

const LOCKED = "Locked";
const LEVELS_COUNT = 60;

export default class Wanikani {
  constructor(APIKey) {
    this.APIKey = APIKey;
    this.url = "https://api.wanikani.com/v2/";
  }

  getUser() {
    return this.get("user");
  }

  getSrsStages() {
    return this.get("srs_stages").then(({ data }) => data);
  }

  getKanjiInfos(minLevel, maxLevel) {
    const levels = Array(LEVELS_COUNT)
      .fill()
      .map((_, i) => i + 1)
      .filter(i => i >= minLevel && i <= maxLevel);
    return Promise.all([
      this.getKanjiStudyInfos(levels),
      this.getAllKanjiStaticInfos(),
    ]).then(([studyInfos, staticInfos]) => {
      const studyInfosMap = studyInfos.reduce(
        (acc, info) => ({ ...acc, [info.subjectId]: info }),
        {}
      );
      return mapValues(staticInfos, (info) => ({
        ...info,
        stage: studyInfosMap[info.id]
          ? studyInfosMap[info.id].srsStageName
          : LOCKED,
        ...studyInfosMap[info.id],
      }));
    });
  }

  getKanjiStudyInfos(levels) {
    return this.getPagedData(
      `assignments?subject_types=kanji&unlocked=true&levels=${levels.join(',')}`
    ).then((all) =>
      all.map(({ data }) => ({
        srsStage: data.srs_stage,
        srsStageName: data.srs_stage_name,
        subjectId: data.subject_id,
      }))
    );
  }

  getAllKanjiStaticInfos(path = "subjects?types=kanji&unlocked=true") {
    return this.getPagedData(path)
      .then((all) =>
        all
          .map((item) => ({
            id: item.id,
            kanji: item.data.characters,
            level: item.data.level,
            meanings: item.data.meanings,
            readings: item.data.readings,
          }))
          .reduce((acc, subject) => ({ ...acc, [subject.kanji]: subject }), {})
      )
      .then((ids) =>
        ids.length === 0
          ? Promise.reject(Error("no kanji subjects"))
          : Promise.resolve(ids)
      );
  }

  get(path) {
    return fetch(`${this.url}${path.replace(this.url, "")}`, {
      headers: new Headers({ Authorization: `Bearer ${this.APIKey}` }),
    })
      .then((response) =>
        response.ok
          ? response
          : Promise.reject(new Error(response.statusText || "error"))
      )
      .then((response) => response.json());
  }

  getPagedData(path, acc = []) {
    return this.get(path).then((res) =>
      res.pages.next_url
        ? this.getPagedData(res.pages.next_url, acc.concat(res.data))
        : Promise.resolve(acc.concat(res.data))
    );
  }
}
