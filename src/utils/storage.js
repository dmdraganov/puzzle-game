export default {
  save(data) {
    localStorage.setItem("puzzleSave", JSON.stringify(data));
  },

  load() {
    const data = localStorage.getItem("puzzleSave");
    if (!data) return null;
    return JSON.parse(data);
  },
};
