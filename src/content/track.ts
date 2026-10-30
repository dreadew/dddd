// Трек в плеере. Чтобы поменять песню, положи mp3 в public/ и поправь эти три строки.
// src: путь от public/, например "/sweet-creature.mp3" для public/sweet-creature.mp3.
export const track = {
  title: "Sweet Creature",
  artist: "Harry Styles",
  src: "/sweet-creature.mp3",
};

// Отрывок песни, который звучит только в главе «Октябрь. Вечер. Набережная.».
// Когда она доходит до этой главы и музыка играет, основной трек встаёт на паузу,
// звучит отрывок, потом основной трек продолжается с того же места.
// Файл: public/we-fell-in-love-in-october.mp3. Без файла отрывок просто пропускается.
export const featuredClip = {
  title: "We Fell in Love in October",
  artist: "girl in red",
  src: "/we-fell-in-love-in-october.mp3",
  // startAt: с какой секунды файла начинается отрывок (например 45 = с 0:45).
  startAt: 0,
  // duration: сколько секунд звучит отрывок.
  duration: 30,
};
