const STORE_KEY = "gem-arcade-state-v1";

const games = {
  "gem-pop": {
    title: "Gem Pop",
    genre: "反射神経ゲーム",
    description: "落ちてくるGEMをクリックしてスコアを伸ばす、Flash時代っぽいシンプル反射ゲーム。",
    thumbClass: "thumb-gem-pop",
    order: 1,
    releasedAt: "2026-05-01",
    duration: 30,
    hint: "落ちてくるGEMをクリックして集めよう。金色は高得点です。",
    boardId: "gemPopRanks",
  },
  "code-runner": {
    title: "Code Runner",
    genre: "よける・集めるゲーム",
    description: "左右に動いてコードブロックを回収。赤いバグをよけながらハイスコアを狙います。",
    thumbClass: "thumb-code-runner",
    order: 2,
    releasedAt: "2026-05-01",
    duration: 45,
    hint: "左右キーかA/Dで動いて、青いコードブロックを集めよう。赤いバグはよけてください。",
    boardId: "codeRunnerRanks",
  },
  "passcode-crack": {
    title: "Passcode Crack",
    genre: "推理・数字パズル",
    description: "4桁の秘密コードを推理。数字と位置の2つのヒントから解読します。",
    thumbClass: "thumb-passcode-crack",
    order: 3,
    releasedAt: "2026-05-01",
    duration: 90,
    hint: "4桁コードを解除。ヒントは数字と位置の2種類です。",
    boardId: "passcodeRanks",
  },
  cryptogram: {
    title: "Cryptogram Lite",
    genre: "ことば・暗号パズル",
    description: "文字の上にある暗号記号を手がかりに、ひらがなや英語の短文を解読します。",
    thumbClass: "thumb-cryptogram",
    order: 4,
    releasedAt: "2026-05-02",
    duration: 60,
    hint: "同じ暗号記号は同じ文字。見えている文字を手がかりに穴を埋めよう。",
    boardId: "cryptogramRanks",
  },
};

const defaultState = {
  playerName: "",
  gems: 0,
  scores: {
    "gem-pop": [],
    "code-runner": [],
    "passcode-crack": [],
    cryptogram: [],
  },
  bestByDay: {},
  favorites: [],
  libraryView: "list",
  sortMode: "recommended",
};

const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreValue = document.querySelector("#scoreValue");
const timeValue = document.querySelector("#timeValue");
const roundGemValue = document.querySelector("#roundGemValue");
const startButton = document.querySelector("#startButton");
const resetButton = document.querySelector("#resetButton");
const fullscreenButton = document.querySelector("#fullscreenButton");
const gameTitle = document.querySelector("#gameTitle");
const gameGenre = document.querySelector("#gameGenre");
const gameHint = document.querySelector("#gameHint");
const gameCardGrid = document.querySelector("#gameCardGrid");
const sortSelect = document.querySelector("#sortSelect");
const viewButtons = document.querySelectorAll("[data-view]");
const playSection = document.querySelector("#play");
const gamesSection = document.querySelector("#games");
const landingSections = ["#home", "#profile", "#games", "#scoreboard", "#studio"].map((selector) =>
  document.querySelector(selector),
);
const gameViewport = document.querySelector("#gameViewport");
const nameDialog = document.querySelector("#nameDialog");
const nameForm = document.querySelector("#nameForm");
const playerNameInput = document.querySelector("#playerNameInput");
const changePlayerButton = document.querySelector("#changePlayerButton");
const heroNameButton = document.querySelector("#heroNameButton");
const cancelNameButton = document.querySelector("#cancelNameButton");
const activePlayerName = document.querySelector("#activePlayerName");
const gemBalance = document.querySelector("#gemBalance");
const todayBest = document.querySelector("#todayBest");

let state = loadState();
let activeGameId = "gem-pop";
let isRunning = false;
let score = 0;
let roundGems = 0;
let timeLeft = games[activeGameId].duration;
let lastTick = 0;
let entities = [];
let player = { x: canvas.width / 2 - 34, y: canvas.height - 64, w: 68, h: 44, speed: 390 };
let keys = new Set();
let spawnTimer = 0;
let nextSpawn = 0.7;
let animationId = 0;
let passcode = {
  secret: "",
  input: "",
  attempts: [],
  message: "スタートで秘密コードを作ります",
  solvedCode: "",
};
let cryptogram = {
  puzzle: null,
  choices: [],
  selected: 0,
  message: "問題カードを選んで開始します",
  mistakes: 0,
  solved: 0,
  lastAward: 0,
  solvedText: "",
  recentTexts: [],
  awaitingNext: false,
};

const cryptogramDifficulty = [
  { stars: 1, label: "★", holes: 1, points: 500 },
  { stars: 2, label: "★★", holes: 2, points: 900 },
  { stars: 3, label: "★★★", holes: 3, points: 1400 },
];

const cryptogramSources = [
  { language: "ひらがな", text: "ねこがねる", clue: "どうぶつ" },
  { language: "ひらがな", text: "ももをたべる", clue: "くだもの" },
  { language: "ひらがな", text: "ははがわらう", clue: "かぞく" },
  { language: "ひらがな", text: "ここであそぶ", clue: "ばしょ" },
  { language: "ひらがな", text: "みみをすます", clue: "からだ" },
  { language: "ひらがな", text: "あおいあさ", clue: "いろとじかん" },
  { language: "ひらがな", text: "こころがころころかわる", clue: "きもち" },
  { language: "ひらがな", text: "あさからあめがあがる", clue: "てんき" },
  { language: "ひらがな", text: "いぬがにわでまっている", clue: "どうぶつ" },
  { language: "ひらがな", text: "とりがそらをとぶ", clue: "どうぶつ" },
  { language: "ひらがな", text: "うさぎがくさをたべる", clue: "どうぶつ" },
  { language: "ひらがな", text: "さかながすいすいおよぐ", clue: "どうぶつ" },
  { language: "ひらがな", text: "ありがあまいおかしをはこぶ", clue: "どうぶつ" },
  { language: "ひらがな", text: "くまがきのしたでくつろぐ", clue: "どうぶつ" },
  { language: "ひらがな", text: "ぞうがみずをみずぎわでのむ", clue: "どうぶつ" },
  { language: "ひらがな", text: "ぱんだがささをたべる", clue: "どうぶつ" },
  { language: "ひらがな", text: "あかいりんごをあさにたべる", clue: "たべもの" },
  { language: "ひらがな", text: "あまいみかんをみんなでむく", clue: "たべもの" },
  { language: "ひらがな", text: "ごはんをよくかんでたべる", clue: "たべもの" },
  { language: "ひらがな", text: "すしをすこしたべる", clue: "たべもの" },
  { language: "ひらがな", text: "からいかれーをたべる", clue: "たべもの" },
  { language: "ひらがな", text: "あついみそしるをすこしのむ", clue: "たべもの" },
  { language: "ひらがな", text: "つめたいみずをまたのむ", clue: "のみもの" },
  { language: "ひらがな", text: "あまいここあをのむ", clue: "のみもの" },
  { language: "ひらがな", text: "あさにぎゅうにゅうをのむ", clue: "のみもの" },
  { language: "ひらがな", text: "おちゃをゆっくりもういちどのむ", clue: "のみもの" },
  { language: "ひらがな", text: "ほんをよんでまなぶ", clue: "がっこう" },
  { language: "ひらがな", text: "えんぴつでじをていねいにかく", clue: "がっこう" },
  { language: "ひらがな", text: "のーとにこたえをのこしてかく", clue: "がっこう" },
  { language: "ひらがな", text: "せんせいがてをたたく", clue: "がっこう" },
  { language: "ひらがな", text: "ともだちとこたえをさがす", clue: "がっこう" },
  { language: "ひらがな", text: "つくえをきれいにしておく", clue: "がっこう" },
  { language: "ひらがな", text: "かばんをせなかにかける", clue: "がっこう" },
  { language: "ひらがな", text: "ろうかをゆっくりあるく", clue: "がっこう" },
  { language: "ひらがな", text: "そとでぼーるをける", clue: "あそび" },
  { language: "ひらがな", text: "なわとびをなんどもとぶ", clue: "あそび" },
  { language: "ひらがな", text: "おにごっこでにげる", clue: "あそび" },
  { language: "ひらがな", text: "すなばでやまをまたつくる", clue: "あそび" },
  { language: "ひらがな", text: "こうえんでみんなとあそぶ", clue: "あそび" },
  { language: "ひらがな", text: "ぶらんこをゆっくりこぐ", clue: "あそび" },
  { language: "ひらがな", text: "ぱずるをひとつとく", clue: "あそび" },
  { language: "ひらがな", text: "げーむでこつをつかむ", clue: "あそび" },
  { language: "ひらがな", text: "あさひがまどからあかるくはいる", clue: "じかん" },
  { language: "ひらがな", text: "ひるにそとであそぶ", clue: "じかん" },
  { language: "ひらがな", text: "よるにほしをみる", clue: "じかん" },
  { language: "ひらがな", text: "きょうもはやくねてまたあしたまつ", clue: "じかん" },
  { language: "ひらがな", text: "あしたまたあそぼう", clue: "じかん" },
  { language: "ひらがな", text: "まいにちすこしずつすすむ", clue: "じかん" },
  { language: "ひらがな", text: "あめがやんでにじがでる", clue: "てんき" },
  { language: "ひらがな", text: "かぜがはっぱをぱたぱたゆらす", clue: "てんき" },
  { language: "ひらがな", text: "ゆきがしずかにふりふりつもる", clue: "てんき" },
  { language: "ひらがな", text: "くもがそらをながれる", clue: "てんき" },
  { language: "ひらがな", text: "たいようがきらきらひかる", clue: "てんき" },
  { language: "ひらがな", text: "あついひにみずをみんなでのむ", clue: "てんき" },
  { language: "ひらがな", text: "さむいあさにてをこする", clue: "てんき" },
  { language: "ひらがな", text: "はるにさくらがさく", clue: "きせつ" },
  { language: "ひらがな", text: "なつにうみでみんなとおよぐ", clue: "きせつ" },
  { language: "ひらがな", text: "あきにきのみをひろう", clue: "きせつ" },
  { language: "ひらがな", text: "ふゆにゆきであそぶ", clue: "きせつ" },
  { language: "ひらがな", text: "あおいそらをみあげる", clue: "いろ" },
  { language: "ひらがな", text: "しろいくもがゆっくりうかぶ", clue: "いろ" },
  { language: "ひらがな", text: "くろいかげがながくのびる", clue: "いろ" },
  { language: "ひらがな", text: "きいろいはながさく", clue: "いろ" },
  { language: "ひらがな", text: "みどりのくさがのびる", clue: "いろ" },
  { language: "ひらがな", text: "あかいぼうしをかぶる", clue: "いろ" },
  { language: "ひらがな", text: "てをあらってきれいにする", clue: "からだ" },
  { language: "ひらがな", text: "あしでゆっくりあるく", clue: "からだ" },
  { language: "ひらがな", text: "めでちいさなじをじっとみる", clue: "からだ" },
  { language: "ひらがな", text: "みみでおとをきく", clue: "からだ" },
  { language: "ひらがな", text: "くちでありがとうという", clue: "からだ" },
  { language: "ひらがな", text: "せなかをまっすぐにする", clue: "からだ" },
  { language: "ひらがな", text: "いえでまどをあけてかぜをいれる", clue: "くらし" },
  { language: "ひらがな", text: "へやをすこしずつすぐかたづける", clue: "くらし" },
  { language: "ひらがな", text: "ふくをたたんでしまう", clue: "くらし" },
  { language: "ひらがな", text: "くつをそろえておく", clue: "くらし" },
  { language: "ひらがな", text: "おふろでからだをあらう", clue: "くらし" },
  { language: "ひらがな", text: "ねるまえにはをねんいりにみがく", clue: "くらし" },
  { language: "ひらがな", text: "まちでばすをまつ", clue: "ばしょ" },
  { language: "ひらがな", text: "えきででんしゃをまつ", clue: "ばしょ" },
  { language: "ひらがな", text: "みせでおかしをみんなでえらぶ", clue: "ばしょ" },
  { language: "ひらがな", text: "としょかんでほんをよむ", clue: "ばしょ" },
  { language: "ひらがな", text: "こうさてんでみぎをみる", clue: "ばしょ" },
  { language: "ひらがな", text: "やまみちをゆっくりまたのぼる", clue: "ばしょ" },
  { language: "English", text: "i like milk", clue: "food" },
  { language: "English", text: "we see a bee", clue: "animal" },
  { language: "English", text: "a cat can nap", clue: "animal" },
  { language: "English", text: "i can kick", clue: "action" },
  { language: "English", text: "look at a book", clue: "school" },
  { language: "English", text: "we will read red words", clue: "school" },
  { language: "English", text: "a small ball rolls well", clue: "play" },
  { language: "English", text: "i like rice", clue: "food" },
  { language: "English", text: "i like cake", clue: "food" },
  { language: "English", text: "i like apples", clue: "food" },
  { language: "English", text: "we eat sweet fruit", clue: "food" },
  { language: "English", text: "you can make soup", clue: "food" },
  { language: "English", text: "we drink cold water", clue: "drink" },
  { language: "English", text: "i want hot tea", clue: "drink" },
  { language: "English", text: "milk is in my cup", clue: "drink" },
  { language: "English", text: "a dog can run", clue: "animal" },
  { language: "English", text: "a cat can sit", clue: "animal" },
  { language: "English", text: "a bird can sing", clue: "animal" },
  { language: "English", text: "fish swim in water", clue: "animal" },
  { language: "English", text: "a rabbit is white", clue: "animal" },
  { language: "English", text: "a bear is big", clue: "animal" },
  { language: "English", text: "we see a small ant", clue: "animal" },
  { language: "English", text: "a duck can walk", clue: "animal" },
  { language: "English", text: "i read a book", clue: "school" },
  { language: "English", text: "we write with pens", clue: "school" },
  { language: "English", text: "you have a red pen", clue: "school" },
  { language: "English", text: "my desk is clean", clue: "school" },
  { language: "English", text: "we study math", clue: "school" },
  { language: "English", text: "i can spell words", clue: "school" },
  { language: "English", text: "the class starts now", clue: "school" },
  { language: "English", text: "we listen and learn", clue: "school" },
  { language: "English", text: "i play a game", clue: "play" },
  { language: "English", text: "we play with a ball", clue: "play" },
  { language: "English", text: "you can kick a ball", clue: "play" },
  { language: "English", text: "i jump in the park", clue: "play" },
  { language: "English", text: "we run and laugh", clue: "play" },
  { language: "English", text: "i can swim fast", clue: "play" },
  { language: "English", text: "we make a sand hill", clue: "play" },
  { language: "English", text: "i ride my bike", clue: "play" },
  { language: "English", text: "the sun is hot", clue: "weather" },
  { language: "English", text: "rain falls today", clue: "weather" },
  { language: "English", text: "snow is white", clue: "weather" },
  { language: "English", text: "the wind is strong", clue: "weather" },
  { language: "English", text: "clouds cover the sky", clue: "weather" },
  { language: "English", text: "a rainbow is bright", clue: "weather" },
  { language: "English", text: "spring is warm", clue: "season" },
  { language: "English", text: "summer is hot", clue: "season" },
  { language: "English", text: "fall leaves are red", clue: "season" },
  { language: "English", text: "winter snow is cold", clue: "season" },
  { language: "English", text: "red is my color", clue: "color" },
  { language: "English", text: "blue sky is clear", clue: "color" },
  { language: "English", text: "green grass grows", clue: "color" },
  { language: "English", text: "yellow flowers open", clue: "color" },
  { language: "English", text: "black cats can hide", clue: "color" },
  { language: "English", text: "white clouds float", clue: "color" },
  { language: "English", text: "i wash my hands", clue: "body" },
  { language: "English", text: "my eyes can see", clue: "body" },
  { language: "English", text: "my ears can hear", clue: "body" },
  { language: "English", text: "my feet can run", clue: "body" },
  { language: "English", text: "i brush my teeth", clue: "body" },
  { language: "English", text: "my nose can smell", clue: "body" },
  { language: "English", text: "i open the door", clue: "home" },
  { language: "English", text: "we clean the room", clue: "home" },
  { language: "English", text: "i make my bed", clue: "home" },
  { language: "English", text: "we cook at home", clue: "home" },
  { language: "English", text: "i put shoes away", clue: "home" },
  { language: "English", text: "the clock is on the wall", clue: "home" },
  { language: "English", text: "i go to the station", clue: "place" },
  { language: "English", text: "we wait for the bus", clue: "place" },
  { language: "English", text: "i read in the library", clue: "place" },
  { language: "English", text: "we shop at a store", clue: "place" },
  { language: "English", text: "i walk in the town", clue: "place" },
  { language: "English", text: "we climb a small hill", clue: "place" },
  { language: "English", text: "i am happy today", clue: "feeling" },
  { language: "English", text: "you look sleepy", clue: "feeling" },
  { language: "English", text: "we are very glad", clue: "feeling" },
  { language: "English", text: "i feel a little sad", clue: "feeling" },
  { language: "English", text: "she is kind to me", clue: "feeling" },
  { language: "English", text: "he has a big smile", clue: "feeling" },
  { language: "English", text: "one and one is two", clue: "number" },
  { language: "English", text: "three cats sit there", clue: "number" },
  { language: "English", text: "five stars shine", clue: "number" },
  { language: "English", text: "ten coins are in a box", clue: "number" },
  { language: "English", text: "i have seven cards", clue: "number" },
  { language: "English", text: "we count small blocks", clue: "number" },
];

const cryptogramTranslations = {
  "ねこがねる": "A cat sleeps.",
  "ももをたべる": "I eat a peach.",
  "ははがわらう": "My mother laughs.",
  "ここであそぶ": "We play here.",
  "みみをすます": "I listen carefully.",
  "あおいあさ": "A blue morning.",
  "こころがころころかわる": "My feelings change often.",
  "あさからあめがあがる": "The rain stops in the morning.",
  "いぬがにわでまっている": "A dog is waiting in the yard.",
  "とりがそらをとぶ": "A bird flies in the sky.",
  "うさぎがくさをたべる": "A rabbit eats grass.",
  "さかながすいすいおよぐ": "A fish swims smoothly.",
  "ありがあまいおかしをはこぶ": "An ant carries sweet candy.",
  "くまがきのしたでくつろぐ": "A bear rests under a tree.",
  "ぞうがみずをみずぎわでのむ": "An elephant drinks water by the water.",
  "ぱんだがささをたべる": "A panda eats bamboo.",
  "あかいりんごをあさにたべる": "I eat a red apple in the morning.",
  "あまいみかんをみんなでむく": "We peel sweet oranges together.",
  "ごはんをよくかんでたべる": "I chew rice well and eat it.",
  "すしをすこしたべる": "I eat a little sushi.",
  "からいかれーをたべる": "I eat spicy curry.",
  "あついみそしるをすこしのむ": "I drink a little hot miso soup.",
  "つめたいみずをまたのむ": "I drink cold water again.",
  "あまいここあをのむ": "I drink sweet cocoa.",
  "あさにぎゅうにゅうをのむ": "I drink milk in the morning.",
  "おちゃをゆっくりもういちどのむ": "I slowly drink tea again.",
  "ほんをよんでまなぶ": "I read a book and learn.",
  "えんぴつでじをていねいにかく": "I write letters carefully with a pencil.",
  "のーとにこたえをのこしてかく": "I write the answer in my notebook.",
  "せんせいがてをたたく": "The teacher claps hands.",
  "ともだちとこたえをさがす": "I look for the answer with my friend.",
  "つくえをきれいにしておく": "I keep my desk clean.",
  "かばんをせなかにかける": "I put my bag on my back.",
  "ろうかをゆっくりあるく": "I walk slowly in the hall.",
  "そとでぼーるをける": "I kick a ball outside.",
  "なわとびをなんどもとぶ": "I jump rope many times.",
  "おにごっこでにげる": "I run away in tag.",
  "すなばでやまをまたつくる": "I make a hill in the sandbox again.",
  "こうえんでみんなとあそぶ": "I play with everyone in the park.",
  "ぶらんこをゆっくりこぐ": "I swing slowly.",
  "ぱずるをひとつとく": "I solve one puzzle.",
  "げーむでこつをつかむ": "I learn a trick in the game.",
  "あさひがまどからあかるくはいる": "Morning light comes in through the window.",
  "ひるにそとであそぶ": "I play outside at noon.",
  "よるにほしをみる": "I see stars at night.",
  "きょうもはやくねてまたあしたまつ": "I sleep early today and wait for tomorrow.",
  "あしたまたあそぼう": "Let's play again tomorrow.",
  "まいにちすこしずつすすむ": "I move forward little by little every day.",
  "あめがやんでにじがでる": "The rain stops and a rainbow appears.",
  "かぜがはっぱをぱたぱたゆらす": "The wind shakes the leaves.",
  "ゆきがしずかにふりふりつもる": "Snow falls quietly and piles up.",
  "くもがそらをながれる": "Clouds move across the sky.",
  "たいようがきらきらひかる": "The sun shines brightly.",
  "あついひにみずをみんなでのむ": "We drink water on a hot day.",
  "さむいあさにてをこする": "I rub my hands on a cold morning.",
  "はるにさくらがさく": "Cherry blossoms bloom in spring.",
  "なつにうみでみんなとおよぐ": "We swim in the sea in summer.",
  "あきにきのみをひろう": "I pick up nuts in autumn.",
  "ふゆにゆきであそぶ": "I play in the snow in winter.",
  "あおいそらをみあげる": "I look up at the blue sky.",
  "しろいくもがゆっくりうかぶ": "White clouds float slowly.",
  "くろいかげがながくのびる": "A black shadow grows long.",
  "きいろいはながさく": "Yellow flowers bloom.",
  "みどりのくさがのびる": "Green grass grows.",
  "あかいぼうしをかぶる": "I wear a red cap.",
  "てをあらってきれいにする": "I wash my hands and make them clean.",
  "あしでゆっくりあるく": "I walk slowly with my feet.",
  "めでちいさなじをじっとみる": "I look closely at small letters.",
  "みみでおとをきく": "I hear sounds with my ears.",
  "くちでありがとうという": "I say thank you with my mouth.",
  "せなかをまっすぐにする": "I straighten my back.",
  "いえでまどをあけてかぜをいれる": "I open the window at home and let in the wind.",
  "へやをすこしずつすぐかたづける": "I clean my room little by little.",
  "ふくをたたんでしまう": "I fold and put away clothes.",
  "くつをそろえておく": "I line up my shoes.",
  "おふろでからだをあらう": "I wash my body in the bath.",
  "ねるまえにはをねんいりにみがく": "I brush my teeth carefully before bed.",
  "まちでばすをまつ": "I wait for a bus in town.",
  "えきででんしゃをまつ": "I wait for a train at the station.",
  "みせでおかしをみんなでえらぶ": "We choose snacks at the store.",
  "としょかんでほんをよむ": "I read a book at the library.",
  "こうさてんでみぎをみる": "I look right at the crossing.",
  "やまみちをゆっくりまたのぼる": "I climb the mountain path slowly again.",
  "i like milk": "わたしは牛乳が好きです。",
  "we see a bee": "わたしたちはハチを見ます。",
  "a cat can nap": "ねこは昼寝ができます。",
  "i can kick": "わたしはけることができます。",
  "look at a book": "本を見てください。",
  "we will read red words": "わたしたちは赤い言葉を読みます。",
  "a small ball rolls well": "小さいボールはよく転がります。",
  "i like rice": "わたしはごはんが好きです。",
  "i like cake": "わたしはケーキが好きです。",
  "i like apples": "わたしはりんごが好きです。",
  "we eat sweet fruit": "わたしたちは甘い果物を食べます。",
  "you can make soup": "あなたはスープを作れます。",
  "we drink cold water": "わたしたちは冷たい水を飲みます。",
  "i want hot tea": "わたしは熱いお茶がほしいです。",
  "milk is in my cup": "牛乳がわたしのカップに入っています。",
  "a dog can run": "犬は走ることができます。",
  "a cat can sit": "ねこはすわることができます。",
  "a bird can sing": "鳥は歌うことができます。",
  "fish swim in water": "魚は水の中を泳ぎます。",
  "a rabbit is white": "うさぎは白いです。",
  "a bear is big": "くまは大きいです。",
  "we see a small ant": "わたしたちは小さいアリを見ます。",
  "a duck can walk": "アヒルは歩くことができます。",
  "i read a book": "わたしは本を読みます。",
  "we write with pens": "わたしたちはペンで書きます。",
  "you have a red pen": "あなたは赤いペンを持っています。",
  "my desk is clean": "わたしの机はきれいです。",
  "we study math": "わたしたちは算数を勉強します。",
  "i can spell words": "わたしは単語をつづれます。",
  "the class starts now": "授業が今始まります。",
  "we listen and learn": "わたしたちは聞いて学びます。",
  "i play a game": "わたしはゲームをします。",
  "we play with a ball": "わたしたちはボールで遊びます。",
  "you can kick a ball": "あなたはボールをけることができます。",
  "i jump in the park": "わたしは公園でジャンプします。",
  "we run and laugh": "わたしたちは走って笑います。",
  "i can swim fast": "わたしは速く泳げます。",
  "we make a sand hill": "わたしたちは砂の山を作ります。",
  "i ride my bike": "わたしは自転車に乗ります。",
  "the sun is hot": "太陽は暑いです。",
  "rain falls today": "今日は雨が降ります。",
  "snow is white": "雪は白いです。",
  "the wind is strong": "風が強いです。",
  "clouds cover the sky": "雲が空をおおいます。",
  "a rainbow is bright": "にじは明るいです。",
  "spring is warm": "春は暖かいです。",
  "summer is hot": "夏は暑いです。",
  "fall leaves are red": "秋の葉は赤いです。",
  "winter snow is cold": "冬の雪は冷たいです。",
  "red is my color": "赤はわたしの色です。",
  "blue sky is clear": "青い空はすんでいます。",
  "green grass grows": "緑の草が育ちます。",
  "yellow flowers open": "黄色い花が開きます。",
  "black cats can hide": "黒いねこはかくれられます。",
  "white clouds float": "白い雲が浮かびます。",
  "i wash my hands": "わたしは手を洗います。",
  "my eyes can see": "わたしの目は見ることができます。",
  "my ears can hear": "わたしの耳は聞くことができます。",
  "my feet can run": "わたしの足は走ることができます。",
  "i brush my teeth": "わたしは歯をみがきます。",
  "my nose can smell": "わたしの鼻はにおいをかげます。",
  "i open the door": "わたしはドアを開けます。",
  "we clean the room": "わたしたちは部屋をそうじします。",
  "i make my bed": "わたしはベッドを整えます。",
  "we cook at home": "わたしたちは家で料理します。",
  "i put shoes away": "わたしはくつを片づけます。",
  "the clock is on the wall": "時計は壁にあります。",
  "i go to the station": "わたしは駅へ行きます。",
  "we wait for the bus": "わたしたちはバスを待ちます。",
  "i read in the library": "わたしは図書館で読みます。",
  "we shop at a store": "わたしたちは店で買い物します。",
  "i walk in the town": "わたしは町を歩きます。",
  "we climb a small hill": "わたしたちは小さい丘を登ります。",
  "i am happy today": "わたしは今日うれしいです。",
  "you look sleepy": "あなたは眠そうです。",
  "we are very glad": "わたしたちはとてもうれしいです。",
  "i feel a little sad": "わたしは少し悲しいです。",
  "she is kind to me": "彼女はわたしに親切です。",
  "he has a big smile": "彼は大きな笑顔です。",
  "one and one is two": "一と一は二です。",
  "three cats sit there": "三匹のねこがそこにすわっています。",
  "five stars shine": "五つの星が光ります。",
  "ten coins are in a box": "十枚のコインが箱に入っています。",
  "i have seven cards": "わたしは七枚のカードを持っています。",
  "we count small blocks": "わたしたちは小さいブロックを数えます。",
};

function isPasscodeCompact() {
  return activeGameId === "passcode-crack" && window.matchMedia("(max-width: 620px)").matches && !document.fullscreenElement;
}

function isCompactPuzzleGame() {
  return (
    (activeGameId === "passcode-crack" || activeGameId === "cryptogram") &&
    window.matchMedia("(max-width: 620px)").matches &&
    !document.fullscreenElement
  );
}

function configureCanvasSize() {
  const compact = isCompactPuzzleGame();
  const nextWidth = compact ? 720 : 1280;
  const nextHeight = compact && activeGameId === "cryptogram" ? 960 : 720;
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY));
    return {
      ...defaultState,
      ...parsed,
      scores: { ...defaultState.scores, ...(parsed?.scores || {}) },
      bestByDay: { ...defaultState.bestByDay, ...(parsed?.bestByDay || {}) },
      favorites: parsed?.favorites || defaultState.favorites,
      libraryView: parsed?.libraryView || defaultState.libraryView,
      sortMode: parsed?.sortMode || defaultState.sortMode,
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function updateProfile() {
  activePlayerName.textContent = state.playerName || "未登録";
  gemBalance.textContent = state.gems.toLocaleString("ja-JP");
  const day = todayKey();
  todayBest.textContent = Math.max(
    ...Object.keys(games).map((gameId) => state.bestByDay[`${day}:${gameId}`] || 0),
  ).toLocaleString("ja-JP");
  changePlayerButton.textContent = state.playerName ? `${state.playerName} / 変更` : "なまえ登録";
}

function renderScoreboards() {
  Object.entries(games).forEach(([gameId, game]) => {
    const list = document.querySelector(`#${game.boardId}`);
    const rows = [...(state.scores[gameId] || [])]
      .sort((a, b) => b.score - a.score || b.gems - a.gems)
      .slice(0, 5);

    list.innerHTML = "";
    if (rows.length === 0) {
      const item = document.createElement("li");
      item.textContent = "まだスコアがありません";
      list.append(item);
      return;
    }

    rows.forEach((row) => {
      const item = document.createElement("li");
      item.innerHTML = `<strong>${escapeHtml(row.name)}</strong> ${row.score.toLocaleString("ja-JP")}点 / +${row.gems} GEM`;
      list.append(item);
    });
  });
}

function renderGameCards() {
  gameCardGrid.classList.toggle("is-grid", state.libraryView === "grid");
  viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.libraryView);
  });
  sortSelect.value = state.sortMode;

  gameCardGrid.innerHTML = "";
  getSortedGames().forEach(([gameId, game]) => {
    const leader = getLeader(gameId);
    const isFavorite = state.favorites.includes(gameId);
    const card = document.createElement("article");
    card.className = "game-card";
    card.tabIndex = 0;
    card.dataset.openGame = gameId;
    card.innerHTML = `
      <div class="game-thumb ${game.thumbClass}" aria-hidden="true"></div>
      <div>
        <p class="label">${escapeHtml(game.genre)}</p>
        <h3>${escapeHtml(game.title)}</h3>
        <p>${escapeHtml(game.description)}</p>
        <div class="game-meta-row">
          <span class="top-player">1位 ${escapeHtml(leader)}</span>
          <button class="favorite-button ${isFavorite ? "is-favorite" : ""}" type="button" data-favorite="${gameId}" aria-pressed="${isFavorite}">
            ${isFavorite ? "★ お気に入り" : "☆ お気に入り"}
          </button>
        </div>
      </div>
    `;
    gameCardGrid.append(card);
  });
}

function getSortedGames() {
  const entries = Object.entries(games);
  const scoreOf = (gameId) => {
    const scores = state.scores[gameId] || [];
    return scores.reduce((best, row) => Math.max(best, row.score), 0);
  };
  const favoriteRank = (gameId) => (state.favorites.includes(gameId) ? 0 : 1);

  return entries.sort(([idA, gameA], [idB, gameB]) => {
    if (state.sortMode === "favorite") {
      return favoriteRank(idA) - favoriteRank(idB) || gameA.order - gameB.order;
    }
    if (state.sortMode === "score") {
      return scoreOf(idB) - scoreOf(idA) || gameA.order - gameB.order;
    }
    if (state.sortMode === "new") {
      return gameB.releasedAt.localeCompare(gameA.releasedAt) || gameA.order - gameB.order;
    }
    if (state.sortMode === "name") {
      return gameA.title.localeCompare(gameB.title, "ja");
    }
    return gameA.order - gameB.order;
  });
}

function toggleFavorite(gameId) {
  if (state.favorites.includes(gameId)) {
    state.favorites = state.favorites.filter((id) => id !== gameId);
  } else {
    state.favorites = [...state.favorites, gameId];
  }
  saveState();
  renderGameCards();
}

function getLeader(gameId) {
  const rows = [...(state.scores[gameId] || [])].sort((a, b) => b.score - a.score || b.gems - a.gems);
  if (!rows.length) return "まだ挑戦者なし";
  return `${rows[0].name} / ${rows[0].score.toLocaleString("ja-JP")}点`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const table = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return table[char];
  });
}

function openNameDialog() {
  playerNameInput.value = state.playerName;
  nameDialog.showModal();
  playerNameInput.focus();
}

function switchGame(gameId) {
  if (isRunning) endGame();
  if (!games[gameId]) gameId = "gem-pop";
  activeGameId = gameId;
  const game = games[gameId];
  gameViewport.dataset.game = gameId;
  configureCanvasSize();
  gameTitle.textContent = game.title;
  gameGenre.textContent = game.genre;
  gameHint.textContent = game.hint;
  timeLeft = game.duration;
  score = 0;
  roundGems = 0;
  startButton.textContent = "スタート";
  startButton.disabled = false;
  updateHud();
  drawIdle();
}

function route() {
  const match = location.hash.match(/^#play\/(.+)$/);
  if (match) {
    switchGame(match[1]);
    landingSections.forEach((section) => section.classList.add("is-hidden"));
    playSection.classList.remove("is-hidden");
    window.scrollTo({ top: 0 });
    return;
  }

  playSection.classList.add("is-hidden");
  landingSections.forEach((section) => section.classList.remove("is-hidden"));
  if (isRunning) endGame();
  if (location.hash === "#games") {
    gamesSection.scrollIntoView({ block: "start" });
  }
}

function updateHud() {
  scoreValue.textContent = score.toLocaleString("ja-JP");
  timeValue.textContent = Math.max(0, Math.ceil(timeLeft));
  roundGemValue.textContent = roundGems;
}

function startGame() {
  if (!state.playerName) {
    openNameDialog();
    return;
  }
  if (activeGameId === "cryptogram") {
    prepareCryptogramChoices(true);
    score = 0;
    roundGems = 0;
    timeLeft = games[activeGameId].duration;
    startButton.textContent = "問題を選んでね";
    startButton.disabled = true;
    updateHud();
    drawCryptogram();
    return;
  }
  isRunning = true;
  score = 0;
  roundGems = 0;
  timeLeft = games[activeGameId].duration;
  lastTick = performance.now();
  entities = [];
  spawnTimer = 0;
  nextSpawn = 0.3;
  if (activeGameId === "passcode-crack") {
    resetPasscodeRound();
  }
  player.x = canvas.width / 2 - player.w / 2;
  startButton.textContent = "プレイ中";
  startButton.disabled = true;
  updateHud();
  animationId = requestAnimationFrame(loop);
}

function endGame() {
  if (!isRunning && score === 0) return;
  isRunning = false;
  cancelAnimationFrame(animationId);
  startButton.textContent = "もう一度";
  startButton.disabled = false;

  const earned = calculateGemReward(score, activeGameId);
  roundGems = earned;
  state.gems += earned;
  const day = todayKey();
  const dayKey = `${day}:${activeGameId}`;
  state.bestByDay[dayKey] = Math.max(state.bestByDay[dayKey] || 0, score);
  state.scores[activeGameId].push({
    name: state.playerName,
    score,
    gems: earned,
    date: new Date().toISOString(),
  });
  state.scores[activeGameId] = state.scores[activeGameId].slice(-50);
  saveState();
  updateHud();
  updateProfile();
  renderScoreboards();
  renderGameCards();
  if (activeGameId === "passcode-crack" && score > 0) {
    animatePasscodeWin(earned);
  } else {
    drawResult(earned);
  }
}

function calculateGemReward(finalScore, gameId) {
  if (finalScore <= 0) return 0;
  if (gameId === "passcode-crack") {
    const base = Math.floor(finalScore / 260);
    const bonus = finalScore >= 3200 ? 8 : finalScore >= 2200 ? 4 : 0;
    return Math.min(80, Math.max(1, base + bonus));
  }
  if (gameId === "cryptogram") {
    const base = Math.floor(finalScore / 220);
    const bonus = finalScore >= 2500 ? 6 : finalScore >= 1800 ? 3 : 0;
    return Math.min(70, Math.max(1, base + bonus));
  }
  const divisor = gameId === "gem-pop" ? 120 : 150;
  const base = Math.floor(finalScore / divisor);
  const bonus = finalScore >= divisor * 8 ? 10 : finalScore >= divisor * 5 ? 5 : 0;
  return Math.min(80, Math.max(1, base + bonus));
}

function loop(now) {
  if (!isRunning) return;
  const dt = Math.min(0.033, (now - lastTick) / 1000);
  lastTick = now;
  timeLeft -= dt;

  if (activeGameId === "gem-pop") updateGemPop(dt);
  if (activeGameId === "code-runner") updateCodeRunner(dt);
  if (activeGameId === "passcode-crack") updatePasscodeCrack();
  if (activeGameId === "cryptogram") updateCryptogram();

  updateHud();
  if (timeLeft <= 0) {
    timeLeft = 0;
    endGame();
    return;
  }
  animationId = requestAnimationFrame(loop);
}

function updateGemPop(dt) {
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnGem();
    spawnTimer = Math.max(0.24, nextSpawn);
    nextSpawn *= 0.985;
  }

  entities.forEach((gem) => {
    gem.y += gem.speed * dt;
    gem.spin += dt * 5;
  });
  entities = entities.filter((gem) => gem.y < canvas.height + 44);

  drawGemPop();
}

function spawnGem() {
  const rare = Math.random() > 0.82;
  entities.push({
    x: 32 + Math.random() * (canvas.width - 64),
    y: -35,
    r: rare ? 22 : 17,
    speed: rare ? 122 + Math.random() * 80 : 150 + Math.random() * 140,
    value: rare ? 120 : 45,
    color: rare ? "#ffc642" : ["#2f80ff", "#1fc7a6", "#ff5f9e"][Math.floor(Math.random() * 3)],
    spin: 0,
  });
}

function updateCodeRunner(dt) {
  if (keys.has("ArrowLeft") || keys.has("a")) player.x -= player.speed * dt;
  if (keys.has("ArrowRight") || keys.has("d")) player.x += player.speed * dt;
  player.x = Math.max(12, Math.min(canvas.width - player.w - 12, player.x));

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnBlock();
    spawnTimer = Math.max(0.3, 0.95 - score / 2600);
  }

  entities.forEach((item) => {
    item.y += item.speed * dt;
    if (!item.hit && intersects(player, item)) {
      item.hit = true;
      if (item.kind === "code") {
        score += 80;
      } else {
        score = Math.max(0, score - 110);
      }
    }
  });

  entities = entities.filter((item) => item.y < canvas.height + 50 && !item.hit);
  drawCodeRunner();
}

function spawnBlock() {
  const isBug = Math.random() > 0.72;
  entities.push({
    x: 18 + Math.random() * (canvas.width - 54),
    y: -42,
    w: isBug ? 42 : 34,
    h: isBug ? 38 : 34,
    speed: 130 + Math.random() * 170,
    kind: isBug ? "bug" : "code",
    hit: false,
  });
}

function resetCryptogramRound() {
  const choices = createCryptogramChoices();
  const source = choices[0].source;
  cryptogram = {
    puzzle: createCryptogramPuzzle(source),
    choices: [],
    selected: 0,
    message: "暗号記号が同じなら、答えの文字も同じです",
    mistakes: 0,
  };
}

function countCryptogramRepeats(source) {
  const counts = {};
  [...source.text].forEach((char) => {
    if (char === " ") return;
    counts[char] = (counts[char] || 0) + 1;
  });
  return Object.values(counts).filter((count) => count >= 2).length;
}

function hasCryptogramRepeat(source) {
  return countCryptogramRepeats(source) >= 1;
}

function createCryptogramChoices() {
  const recent = new Set(cryptogram.recentTexts || []);
  let eligible = cryptogramSources.filter((source) => hasCryptogramRepeat(source) && !recent.has(source.text));
  if (eligible.length < 12) eligible = cryptogramSources.filter(hasCryptogramRepeat);
  const japanese = eligible.filter((source) => source.language === "ひらがな").sort(() => Math.random() - 0.5);
  const english = eligible.filter((source) => source.language === "English").sort(() => Math.random() - 0.5);
  const mixed = [japanese[0], english[0], ...eligible.sort(() => Math.random() - 0.5)]
    .filter(Boolean)
    .filter((source, index, list) => list.findIndex((item) => item.text === source.text) === index)
    .slice(0, 3);

  while (mixed.length < 3 && eligible[mixed.length]) mixed.push(eligible[mixed.length]);
  return mixed.map((source, index) => {
    const maxStars = Math.max(1, Math.min(3, countCryptogramRepeats(source)));
    const targetStars = Math.min(maxStars, cryptogramDifficulty[index]?.stars || 1);
    const difficulty = cryptogramDifficulty.find((item) => item.stars === targetStars) || cryptogramDifficulty[0];
    return {
      source,
      puzzle: createCryptogramPuzzle(source, difficulty),
      difficulty,
    };
  });
}

function prepareCryptogramChoices(resetStats = false) {
  cryptogram = {
    puzzle: null,
    choices: createCryptogramChoices(),
    selected: 0,
    message: resetStats ? "3つのカードから問題を選んでください" : "正解! 次の問題を選んでください",
    mistakes: 0,
    solved: resetStats ? 0 : cryptogram.solved,
    lastAward: resetStats ? 0 : cryptogram.lastAward,
    solvedText: resetStats ? "" : cryptogram.solvedText,
    recentTexts: resetStats ? [] : cryptogram.recentTexts,
    awaitingNext: false,
  };
}

function selectCryptogramChoice(index) {
  const choice = cryptogram.choices[index];
  if (!choice) return;
  if (!state.playerName) {
    openNameDialog();
    return;
  }
  const wasRunning = isRunning;
  cryptogram = {
    puzzle: choice.puzzle,
    choices: [],
    selected: 0,
    message: "暗号記号が同じなら、答えの文字も同じです",
    mistakes: 0,
    solved: cryptogram.solved,
    lastAward: cryptogram.lastAward,
    solvedText: "",
    recentTexts: cryptogram.recentTexts,
    awaitingNext: false,
  };
  if (!wasRunning) {
    isRunning = true;
    score = 0;
    roundGems = 0;
    timeLeft = games[activeGameId].duration;
    animationId = requestAnimationFrame(loop);
  }
  lastTick = performance.now();
  startButton.textContent = "プレイ中";
  startButton.disabled = true;
  updateHud();
}

function createCryptogramPuzzle(source, difficulty = cryptogramDifficulty[0]) {
  const chars = [...source.text];
  const uniqueLetters = [...new Set(chars.filter((char) => char !== " "))];
  const symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const shuffledSymbols = [...symbols].sort(() => Math.random() - 0.5);
  const symbolByChar = {};
  uniqueLetters.forEach((char, index) => {
    symbolByChar[char] = shuffledSymbols[index];
  });

  const positionsByChar = {};
  chars.forEach((char, index) => {
    if (char === " ") return;
    positionsByChar[char] = positionsByChar[char] || [];
    positionsByChar[char].push(index);
  });

  const repeated = Object.entries(positionsByChar).filter(([, positions]) => positions.length >= 2);
  const selectedChars = [...repeated].sort(() => Math.random() - 0.5).slice(0, Math.min(difficulty.holes, repeated.length));
  const holes = selectedChars.map(([char, positions]) => ({
    index: positions[Math.floor(Math.random() * positions.length)],
    answer: char,
    value: "",
  }));

  return {
    ...source,
    chars,
    symbolByChar,
    holes,
    difficulty,
    keyboard: buildCryptogramKeyboard(source, holes),
  };
}

function buildCryptogramKeyboard(source, holes) {
  if (source.language === "English") {
    return "abcdefghijklmnopqrstuvwxyz".split("");
  }
  return "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん".split("");
}

function updateCryptogram() {
  drawCryptogram();
}

function handleCryptogramKey(value) {
  if (!isRunning || activeGameId !== "cryptogram" || !cryptogram.puzzle) return;
  const hole = cryptogram.puzzle.holes[cryptogram.selected];
  if (!hole) return;

  if (value === "backspace") {
    hole.value = "";
    cryptogram.message = "文字を選んで入れ直せます";
    drawCryptogram();
    return;
  }

  hole.value = value;
  if (value === hole.answer) {
    cryptogram.message = "正解の文字です";
    cryptogram.selected = Math.min(cryptogram.selected + 1, cryptogram.puzzle.holes.length - 1);
  } else {
    cryptogram.mistakes += 1;
    cryptogram.message = "ちがう文字です";
  }

  if (cryptogram.puzzle.holes.every((item) => item.value === item.answer)) {
    const difficulty = cryptogram.puzzle.difficulty || cryptogramDifficulty[0];
    const mistakePenalty = cryptogram.mistakes * 90;
    const award = Math.max(Math.floor(difficulty.points * 0.35), difficulty.points - mistakePenalty);
    const solvedText = cryptogram.puzzle.text;
    score += award;
    cryptogram.solved += 1;
    cryptogram.lastAward = award;
    cryptogram.solvedText = solvedText;
    cryptogram.recentTexts = [...(cryptogram.recentTexts || []), solvedText].slice(-120);
    cryptogram.puzzle = null;
    cryptogram.choices = [];
    cryptogram.awaitingNext = true;
    cryptogram.message = `正解 ${cryptogram.solved}問 / +${award}点`;
    updateHud();
    drawCryptogram();
    return;
  }

  drawCryptogram();
}

function getCryptogramLayout(compact = false) {
  return compact
    ? { textY: 150, keyY: 500, keyX: 42, keyW: 56, keyH: 48, gap: 8, perRow: 10 }
    : { textY: 210, keyY: 440, keyX: 90, keyW: 88, keyH: 50, gap: 12, perRow: 10 };
}

function resetPasscodeRound() {
  passcode = {
    secret: String(Math.floor(Math.random() * 10000)).padStart(4, "0"),
    input: "",
    attempts: [],
    message: "4桁を入力してENTER",
    solvedCode: "",
  };
}

function updatePasscodeCrack() {
  drawPasscodeCrack();
}

function submitPasscodeGuess() {
  if (!isRunning || activeGameId !== "passcode-crack" || passcode.input.length !== 4) return;

  const hint = comparePasscode(passcode.secret, passcode.input);
  passcode.attempts.unshift({ code: passcode.input, ...hint });
  passcode.input = "";

  if (hint.exact === 4) {
    const attemptsPenalty = passcode.attempts.length * 180;
    const timeBonus = Math.ceil(timeLeft) * 18;
    score = Math.max(500, 3200 + timeBonus - attemptsPenalty);
    passcode.solvedCode = passcode.attempts[0].code;
    passcode.message = "LOCK OPEN!";
    endGame();
    return;
  }

    passcode.message = `数字 ${hint.misplaced} / 位置 ${hint.exact}`;
}

function comparePasscode(secret, guess) {
  let exact = 0;
  const secretRest = [];
  const guessRest = [];

  for (let i = 0; i < 4; i += 1) {
    if (secret[i] === guess[i]) {
      exact += 1;
    } else {
      secretRest.push(secret[i]);
      guessRest.push(guess[i]);
    }
  }

  const counts = {};
  secretRest.forEach((digit) => {
    counts[digit] = (counts[digit] || 0) + 1;
  });

  let misplaced = 0;
  guessRest.forEach((digit) => {
    if (counts[digit]) {
      misplaced += 1;
      counts[digit] -= 1;
    }
  });

  return {
    exact,
    misplaced,
    wrong: 4 - exact - misplaced,
  };
}

function handlePasscodeKey(value) {
  if (!isRunning || activeGameId !== "passcode-crack") return;
  if (/^\d$/.test(value) && passcode.input.length < 4) {
    passcode.input += value;
    passcode.message = "4桁を入力してENTER";
  }
  if (value === "backspace") {
    passcode.input = passcode.input.slice(0, -1);
  }
  if (value === "enter") {
    submitPasscodeGuess();
  }
  drawPasscodeCrack();
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function drawBase() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#dff0ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(47, 128, 255, 0.14)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 38) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 38) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawGemPop() {
  drawBase();
  entities.forEach((gem) => drawGem(gem.x, gem.y, gem.r, gem.color, gem.spin));
}

function drawGem(x, y, radius, color, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4 + spin);
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(23, 32, 51, 0.18)";
  ctx.shadowBlur = 16;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(-radius * 0.55, -radius * 0.55, radius * 0.7, radius * 0.7);
  ctx.restore();
}

function drawCodeRunner() {
  drawBase();
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, canvas.height - 26, canvas.width, 26);

  entities.forEach((item) => {
    ctx.fillStyle = item.kind === "bug" ? "#ff5f5f" : "#2f80ff";
    roundRect(item.x, item.y, item.w, item.h, 7);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "900 18px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.kind === "bug" ? "!" : "{}", item.x + item.w / 2, item.y + item.h / 2);
  });

  ctx.fillStyle = "#172033";
  roundRect(player.x, player.y, player.w, player.h, 8);
  ctx.fill();
  ctx.fillStyle = "#ffc642";
  roundRect(player.x + 12, player.y - 20, player.w - 24, 24, 7);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(player.x + 18, player.y + 14, 10, 10);
  ctx.fillRect(player.x + player.w - 28, player.y + 14, 10, 10);
}

function drawCryptogram() {
  configureCanvasSize();
  const compact = window.matchMedia("(max-width: 620px)").matches && !document.fullscreenElement;
  const puzzle = cryptogram.puzzle;
  const shell = getCryptogramShell(compact);
  const problemBox = getCryptogramProblemBox(compact);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#edf5ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#172033";
  roundRect(shell.x, shell.y, shell.w, shell.h, 24);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  roundRect(problemBox.x, problemBox.y, problemBox.w, problemBox.h, 18);
  ctx.fill();

  ctx.fillStyle = "#2f80ff";
  ctx.font = compact ? "900 22px system-ui" : "900 28px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CRYPTOGRAM ★", canvas.width / 2, problemBox.y + (compact ? 34 : 44));

  if (!puzzle) {
    if (cryptogram.awaitingNext) {
      drawCryptogramCorrectPanel(compact);
    } else {
      ctx.fillStyle = "#64708a";
      ctx.font = compact ? "800 17px system-ui" : "800 22px system-ui";
      ctx.fillText(
        "カードを選ぶと60秒タイマー開始。時間内にたくさん解こう",
        canvas.width / 2,
        problemBox.y + (compact ? 78 : 92),
      );
      drawCryptogramChoiceCards(compact);
    }
    return;
  }

  ctx.fillStyle = "#64708a";
  ctx.font = compact ? "800 18px system-ui" : "800 20px system-ui";
  ctx.fillText(
    `${puzzle.language} ${puzzle.difficulty.label} / ${puzzle.clue}`,
    canvas.width / 2,
    problemBox.y + (compact ? 68 : 82),
  );
  drawCryptogramText(compact);

  ctx.fillStyle = "#a9b8d6";
  ctx.font = compact ? "800 18px system-ui" : "800 22px system-ui";
  ctx.fillText(cryptogram.message, canvas.width / 2, compact ? 486 : 420);
  drawCryptogramKeyboard(compact);
}

function getCryptogramShell(compact = false) {
  return compact
    ? { x: 54, y: 36, w: canvas.width - 108, h: 884 }
    : { x: 54, y: 48, w: canvas.width - 108, h: 624 };
}

function getCryptogramProblemBox(compact = false) {
  return compact
    ? { x: 86, y: 68, w: canvas.width - 172, h: 390 }
    : { x: 86, y: 82, w: canvas.width - 172, h: 310 };
}

function getCryptogramCells(compact = false) {
  const puzzle = cryptogram.puzzle;
  if (!puzzle) return [];
  const problemBox = getCryptogramProblemBox(compact);
  const cellW = compact ? 52 : 58;
  const gap = compact ? 6 : 8;
  const lineGap = compact ? 82 : 86;
  const availableWidth = problemBox.w - (compact ? 44 : 72);
  const maxPerLine = Math.max(6, Math.floor((availableWidth + gap) / (cellW + gap)));
  const lines = [];
  let current = [];

  puzzle.chars.forEach((char, index) => {
    if (current.length >= maxPerLine && char !== " ") {
      lines.push(current);
      current = [];
    }
    current.push({ char, index });
  });
  if (current.length) lines.push(current);

  const maxLines = compact ? 3 : 2;
  while (lines.length > maxLines) {
    const tail = lines.pop();
    lines[lines.length - 1].push(...tail);
  }

  const contentTop = problemBox.y + (compact ? 130 : 126);
  const contentHeight = problemBox.y + problemBox.h - contentTop - 28;
  const blockHeight = (lines.length - 1) * lineGap + (compact ? 58 : 66);
  const baseY = contentTop + Math.max(0, (contentHeight - blockHeight) / 2);
  return lines.flatMap((line, lineIndex) => {
    const totalWidth = line.length * cellW + (line.length - 1) * gap;
    const startX = (canvas.width - totalWidth) / 2;
    return line.map((item, columnIndex) => ({
      ...item,
      x: startX + columnIndex * (cellW + gap),
      y: baseY + lineIndex * lineGap,
      w: cellW,
      h: compact ? 58 : 66,
    }));
  });
}

function drawCryptogramText(compact = false) {
  const puzzle = cryptogram.puzzle;
  const cells = getCryptogramCells(compact);
  const holeByIndex = new Map(puzzle.holes.map((hole, index) => [hole.index, { ...hole, holeNumber: index }]));

  cells.forEach((cell) => {
    if (cell.char === " ") return;
    const hole = holeByIndex.get(cell.index);
    const symbol = puzzle.symbolByChar[cell.char];

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#64708a";
    ctx.font = compact ? "900 14px system-ui" : "900 16px system-ui";
    ctx.fillText(symbol, cell.x + cell.w / 2, cell.y - 13);

    if (hole) {
      const selected = cryptogram.selected === hole.holeNumber;
      ctx.fillStyle = selected ? "#eef4ff" : "#ffffff";
      ctx.strokeStyle = selected ? "#2f80ff" : "#cbd8ef";
      ctx.lineWidth = selected ? 4 : 2;
      roundRect(cell.x, cell.y, cell.w, cell.h, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = hole.value === hole.answer ? "#1fc7a6" : hole.value ? "#ff5f5f" : "#172033";
      ctx.font = compact ? "900 30px system-ui" : "900 34px system-ui";
      ctx.fillText(hole.value || "_", cell.x + cell.w / 2, cell.y + cell.h / 2 + 1);
    } else {
      ctx.fillStyle = "#172033";
      ctx.font = compact ? "900 30px system-ui" : "900 34px system-ui";
      ctx.fillText(cell.char, cell.x + cell.w / 2, cell.y + cell.h / 2 + 1);
    }
  });
}

function getCryptogramChoiceCards(compact = false) {
  if (compact) {
    const w = canvas.width - 172;
    const h = 112;
    const x = 86;
    const y = 504;
    const gap = 18;
    return [0, 1, 2].map((index) => ({ x, y: y + index * (h + gap), w, h, index }));
  }
  const gap = 20;
  const w = (canvas.width - 172 - gap * 2) / 3;
  const h = 150;
  const y = 450;
  return [0, 1, 2].map((index) => ({
    x: 86 + index * (w + gap),
    y,
    w,
    h,
    index,
  }));
}

function drawCryptogramChoiceCards(compact = false) {
  if (!cryptogram.choices.length) prepareCryptogramChoices();
  const cards = getCryptogramChoiceCards(compact);

  ctx.fillStyle = "#a9b8d6";
  ctx.font = compact ? "800 18px system-ui" : "800 22px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(cryptogram.message, canvas.width / 2, compact ? 486 : 410);

  cards.forEach((card) => {
    const choice = cryptogram.choices[card.index];
    if (!choice) return;
    const label = choice.source.language === "English" ? "English" : "ひらがな";

    ctx.fillStyle = "#f6f8ff";
    roundRect(card.x, card.y, card.w, card.h, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(47, 128, 255, 0.35)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#2f80ff";
    ctx.font = compact ? "900 20px system-ui" : "900 22px system-ui";
    ctx.fillText(`${label} ${choice.difficulty.label}`, card.x + card.w / 2, card.y + (compact ? 30 : 38));

    ctx.fillStyle = "#64708a";
    ctx.font = compact ? "900 22px system-ui" : "900 26px system-ui";
    ctx.fillText(choice.source.clue, card.x + card.w / 2, card.y + (compact ? 76 : 94));
  });
}

function getCryptogramNextButton(compact = false) {
  return compact
    ? { x: 190, y: 640, w: 340, h: 72 }
    : { x: canvas.width / 2 - 160, y: 500, w: 320, h: 72 };
}

function drawCryptogramCorrectPanel(compact = false) {
  const problemBox = getCryptogramProblemBox(compact);
  ctx.fillStyle = "#1fc7a6";
  ctx.font = compact ? "900 42px system-ui" : "900 54px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("正解!", canvas.width / 2, problemBox.y + (compact ? 160 : 140));

  ctx.fillStyle = "#172033";
  ctx.font = compact ? "900 30px system-ui" : "900 38px system-ui";
  ctx.fillText(`+${cryptogram.lastAward.toLocaleString("ja-JP")} 点`, canvas.width / 2, problemBox.y + (compact ? 220 : 200));

  ctx.fillStyle = "#64708a";
  ctx.font = compact ? "800 17px system-ui" : "800 21px system-ui";
  ctx.fillText("完成した文", canvas.width / 2, problemBox.y + (compact ? 268 : 246));

  ctx.fillStyle = "#172033";
  ctx.font = compact ? "900 24px system-ui" : "900 30px system-ui";
  ctx.fillText(cryptogram.solvedText || "", canvas.width / 2, problemBox.y + (compact ? 310 : 288));

  const translation = cryptogramTranslations[cryptogram.solvedText] || "";
  if (translation) {
    ctx.fillStyle = "#64708a";
    ctx.font = compact ? "800 19px system-ui" : "800 24px system-ui";
    ctx.fillText(translation, canvas.width / 2, problemBox.y + (compact ? 350 : 330));
  }

  ctx.fillStyle = "#a9b8d6";
  ctx.font = compact ? "800 18px system-ui" : "800 22px system-ui";
  ctx.fillText(`${cryptogram.solved}問 解読中 / 時間はそのまま進みます`, canvas.width / 2, compact ? 486 : 420);

  const button = getCryptogramNextButton(compact);
  ctx.fillStyle = "#2f80ff";
  roundRect(button.x, button.y, button.w, button.h, 16);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = compact ? "900 24px system-ui" : "900 28px system-ui";
  ctx.fillText("次の問題へ", button.x + button.w / 2, button.y + button.h / 2 + 1);
}

function getCryptogramKeys(compact = false) {
  const puzzle = cryptogram.puzzle;
  if (!puzzle) return [];
  if (puzzle.language === "English") {
    return getEnglishKeyboardKeys(compact);
  }
  return getHiraganaKeyboardKeys(compact);
}

function getEnglishKeyboardKeys(compact = false) {
  const rows = compact ? ["qwertyuiop", "asdfghjkl", "zxcvbnm", "←"] : ["qwertyuiop", "asdfghjkl", "zxcvbnm←"];
  const keyW = compact ? 56 : 88;
  const keyH = compact ? 48 : 50;
  const gap = compact ? 8 : 12;
  const startY = compact ? 520 : 440;

  return rows.flatMap((row, rowIndex) => {
    const chars = [...row];
    const totalWidth = chars.length * keyW + (chars.length - 1) * gap;
    const startX = (canvas.width - totalWidth) / 2;
    return chars.map((label, colIndex) => ({
      label,
      value: label === "←" ? "backspace" : label,
      x: startX + colIndex * (keyW + gap),
      y: startY + rowIndex * (keyH + gap),
      w: label === "←" && !compact ? keyW * 1.25 : keyW,
      h: keyH,
    }));
  });
}

function getHiraganaKeyboardKeys(compact = false) {
  const columns = ["あいうえお", "かきくけこ", "さしすせそ", "たちつてと", "なにぬねの", "はひふへほ", "まみむめも", "やゆよ", "らりるれろ", "わをん"];
  const keyW = compact ? 48 : 58;
  const keyH = compact ? 40 : 44;
  const gap = compact ? 7 : 9;
  const columnGap = compact ? 7 : 9;
  const startY = compact ? 520 : 420;
  const totalWidth = columns.length * keyW + (columns.length - 1) * columnGap;
  const left = (canvas.width - totalWidth) / 2;

  const keys = [];
  columns.forEach((column, columnIndex) => {
    const x = left + (columns.length - 1 - columnIndex) * (keyW + columnGap);
    [...column].forEach((label, rowIndex) => {
      keys.push({
        label,
        value: label,
        x,
        y: startY + rowIndex * (keyH + gap),
        w: keyW,
        h: keyH,
      });
    });
  });

  keys.push({
    label: "←",
    value: "backspace",
    x: left,
    y: startY + 5 * (keyH + gap),
    w: compact ? keyW * 2 + columnGap : keyW * 2 + columnGap,
    h: keyH,
  });
  return keys;
}

function drawCryptogramKeyboard(compact = false) {
  getCryptogramKeys(compact).forEach((key) => {
    const isDelete = key.value === "backspace";
    ctx.fillStyle = isDelete ? "#2f80ff" : "#f6f8ff";
    roundRect(key.x, key.y, key.w, key.h, 10);
    ctx.fill();
    ctx.fillStyle = isDelete ? "#fff" : "#172033";
    ctx.font = compact ? "900 19px system-ui" : "900 22px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(key.label, key.x + key.w / 2, key.y + key.h / 2 + 1);
  });
}

function drawPasscodeCrack() {
  configureCanvasSize();
  const compact = isPasscodeCompact();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#eaf3ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#172033";
  roundRect(compact ? 30 : 72, compact ? 24 : 56, compact ? 660 : 1136, compact ? 672 : 608, 24);
  ctx.fill();

  ctx.fillStyle = "#26334d";
  const panel = compact ? { x: 56, y: 48, w: 608, h: 476 } : { x: 110, y: 94, w: 500, h: 532 };
  roundRect(panel.x, panel.y, panel.w, panel.h, 18);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = compact ? "900 34px system-ui" : "900 42px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LOCK TERMINAL", compact ? 360 : 360, compact ? 92 : 142);

  drawInputSlots(compact);
  drawKeypad(compact);
  drawPasscodeHistory(compact);
}

function drawInputSlots(compact = false) {
  const { startX, y, step, size } = getPasscodeSlotLayout(compact);
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = "#101827";
    roundRect(startX + i * step, y, size.w, size.h, size.r);
    ctx.fill();
    ctx.fillStyle = passcode.input[i] ? "#ffc642" : "#51627f";
    ctx.font = compact ? "900 42px system-ui" : "900 42px system-ui";
    ctx.fillText(passcode.input[i] || "•", startX + i * step + size.w / 2, y + size.h / 2 + 2);
  }
}

function getPasscodeSlotLayout(compact = false) {
  return {
    startX: compact ? 126 : 190,
    y: compact ? 120 : 184,
    step: compact ? 122 : 86,
    size: compact ? { w: 86, h: 76, r: 13 } : { w: 64, h: 76, r: 12 },
  };
}

function getPasscodeButtons(compact = false) {
  const labels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", "ENTER"];
  return labels.map((label, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const layout = compact
      ? { x: 86, y: 218, gapX: 180, gapY: 72, w: 148, h: 54 }
      : { x: 160, y: 296, gapX: 132, gapY: 68, w: 108, h: 50 };
    return {
      label,
      x: layout.x + col * layout.gapX,
      y: layout.y + row * layout.gapY,
      w: layout.w,
      h: layout.h,
    };
  });
}

function drawKeypad(compact = false) {
  getPasscodeButtons(compact).forEach((button) => {
    const isAction = button.label === "DEL" || button.label === "ENTER";
    ctx.fillStyle = isAction ? "#2f80ff" : "#f6f8ff";
    roundRect(button.x, button.y, button.w, button.h, compact ? 12 : 10);
    ctx.fill();
    ctx.fillStyle = isAction ? "#fff" : "#172033";
    ctx.font = compact ? "900 23px system-ui" : "900 22px system-ui";
    ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
  });
}

function drawPasscodeHistory(compact = false) {
  const box = compact ? { x: 56, y: 520, w: 608, h: 156 } : { x: 650, y: 94, w: 520, h: 532 };
  const columns = compact
    ? { index: 84, code: 126, number: 432, spots: 566 }
    : { index: 684, code: 724, number: 930, spots: 1050 };
  ctx.fillStyle = "#f6f8ff";
  roundRect(box.x, box.y, box.w, box.h, 18);
  ctx.fill();

  ctx.font = compact ? "900 22px system-ui" : "900 28px system-ui";
  ctx.fillStyle = "#64708a";
  ctx.textAlign = "left";
  ctx.fillText("入力", columns.code, box.y + (compact ? 28 : 52));
  ctx.textAlign = "center";
  ctx.fillText("🔢", columns.number, box.y + (compact ? 28 : 52));
  ctx.fillText("📍", columns.spots, box.y + (compact ? 28 : 52));
  ctx.textAlign = "left";

  if (passcode.attempts.length === 0) {
    ctx.fillStyle = "#64708a";
    ctx.font = compact ? "800 22px system-ui" : "800 24px system-ui";
    ctx.fillText("まだ入力がありません", columns.index, box.y + (compact ? 92 : 142));
    return;
  }

  const maxRows = 3;
  passcode.attempts.slice(0, maxRows).forEach((attempt, index) => {
    const y = box.y + (compact ? 46 : 100) + index * (compact ? 34 : 64);
    ctx.fillStyle = "#fff";
    roundRect(box.x + 18, y, box.w - 36, compact ? 28 : 50, compact ? 8 : 10);
    ctx.fill();
    ctx.fillStyle = "#172033";
    ctx.font = compact ? "900 20px system-ui" : "900 24px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`${index + 1}.`, columns.index, y + (compact ? 20 : 31));
    ctx.fillText(attempt.code, columns.code, y + (compact ? 20 : 31));
    drawHintMarks(attempt.misplaced, columns.number, y + (compact ? 14 : 25), "#1fc7a6", "diamond", compact);
    drawHintMarks(attempt.exact, columns.spots, y + (compact ? 14 : 25), "#2f80ff", "circle", compact);
    ctx.textAlign = "left";
  });
}

function drawHintMarks(count, centerX, centerY, color, shape, compact = false) {
  const size = compact ? 7 : 9;
  const gap = compact ? 14 : 18;
  const startX = centerX - ((Math.max(count, 1) - 1) * gap) / 2;

  if (count === 0) {
    ctx.strokeStyle = "#a8b5cf";
    ctx.lineWidth = compact ? 2 : 3;
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY - size);
    ctx.lineTo(centerX + size, centerY + size);
    ctx.moveTo(centerX + size, centerY - size);
    ctx.lineTo(centerX - size, centerY + size);
    ctx.stroke();
    return;
  }

  ctx.fillStyle = color;
  for (let i = 0; i < count; i += 1) {
    const x = startX + i * gap;
    ctx.beginPath();
    if (shape === "diamond") {
      ctx.moveTo(x, centerY - size);
      ctx.lineTo(x + size, centerY);
      ctx.lineTo(x, centerY + size);
      ctx.lineTo(x - size, centerY);
      ctx.closePath();
    } else {
      ctx.arc(x, centerY, size, 0, Math.PI * 2);
    }
    ctx.fill();
  }
}

function animatePasscodeWin(earned) {
  const startedAt = performance.now();
  const duration = 2200;

  function frame(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    drawPasscodeWinFrame(progress, earned);
    if (progress < 1) {
      animationId = requestAnimationFrame(frame);
    }
  }

  animationId = requestAnimationFrame(frame);
}

function drawPasscodeWinFrame(progress, earned) {
  drawPasscodeCrack();
  const compact = isPasscodeCompact();
  const pulse = 0.5 + Math.sin(progress * Math.PI * 10) * 0.5;
  const glow = 12 + pulse * 28;
  const code = passcode.solvedCode || passcode.secret || "0000";
  const { startX, y, step, size } = getPasscodeSlotLayout(compact);

  ctx.save();
  ctx.shadowColor = "#1fc7a6";
  ctx.shadowBlur = glow;
  ctx.fillStyle = `rgba(31, 199, 166, ${0.22 + pulse * 0.18})`;
  roundRect(compact ? 56 : 110, compact ? 48 : 94, compact ? 608 : 500, compact ? 476 : 532, 18);
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < 4; i += 1) {
    const x = startX + i * step;
    ctx.save();
    ctx.shadowColor = "#ffc642";
    ctx.shadowBlur = glow;
    ctx.fillStyle = "#101827";
    roundRect(x, y, size.w, size.h, size.r);
    ctx.fill();
    ctx.fillStyle = "#ffc642";
    ctx.font = compact ? "900 42px system-ui" : "900 42px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(code[i], x + size.w / 2, y + size.h / 2 + 2);
    ctx.restore();
  }

  drawConfetti(progress, compact);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#2f80ff";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffffff";
  ctx.font = compact ? "900 34px system-ui" : "900 48px system-ui";
  ctx.fillText("LOCK OPEN!", canvas.width / 2, compact ? 336 : 318);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffc642";
  ctx.font = compact ? "900 22px system-ui" : "900 30px system-ui";
  ctx.fillText(`${score.toLocaleString("ja-JP")} pts  +${earned} GEM`, canvas.width / 2, compact ? 374 : 360);
  ctx.restore();
}

function drawConfetti(progress, compact = false) {
  const colors = ["#2f80ff", "#1fc7a6", "#ffc642", "#ff5f9e", "#ffffff"];
  const count = compact ? 54 : 90;
  const fall = progress * (canvas.height + 180);

  for (let i = 0; i < count; i += 1) {
    const seed = (i * 9301 + 49297) % 233280;
    const seed2 = (i * 12289 + 2713) % 177777;
    const x = ((seed / 233280) * canvas.width + Math.sin(progress * 8 + i) * 18) % canvas.width;
    const y = ((seed2 / 177777) * 180 + fall + i * 11) % (canvas.height + 80) - 40;
    const w = compact ? 8 : 10;
    const h = compact ? 14 : 18;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(progress * Math.PI * 6 + i);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

function drawIdle() {
  if (activeGameId === "passcode-crack") {
    resetPasscodeRound();
    passcode.secret = "----";
    passcode.message = "スタートで秘密コードを作ります";
    drawPasscodeCrack();
    return;
  }
  if (activeGameId === "cryptogram") {
    prepareCryptogramChoices(true);
    drawCryptogram();
    return;
  }
  drawBase();
  ctx.fillStyle = "#172033";
  ctx.font = "900 44px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${games[activeGameId].title} READY`, canvas.width / 2, canvas.height / 2 - 12);
  ctx.fillStyle = "#64708a";
  ctx.font = "700 24px system-ui";
  ctx.fillText("スタートを押して遊ぼう", canvas.width / 2, canvas.height / 2 + 42);
}

function drawResult(earned) {
  drawBase();
  ctx.fillStyle = "#172033";
  ctx.font = "900 48px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("FINISH!", canvas.width / 2, canvas.height / 2 - 48);
  ctx.font = "900 34px system-ui";
  ctx.fillText(`${score.toLocaleString("ja-JP")} 点`, canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = "#2f80ff";
  ctx.fillText(`+${earned} GEM`, canvas.width / 2, canvas.height / 2 + 42);
  if (activeGameId === "cryptogram") {
    ctx.fillStyle = "#64708a";
    ctx.font = "800 24px system-ui";
    ctx.fillText(`${cryptogram.solved}問 解読`, canvas.width / 2, canvas.height / 2 + 88);
  }
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  const compact = window.matchMedia("(max-width: 620px)").matches && !document.fullscreenElement;

  if (activeGameId === "cryptogram" && !cryptogram.puzzle) {
    if (cryptogram.awaitingNext) {
      const nextButton = getCryptogramNextButton(compact);
      if (x >= nextButton.x && x <= nextButton.x + nextButton.w && y >= nextButton.y && y <= nextButton.y + nextButton.h) {
        prepareCryptogramChoices(false);
        drawCryptogram();
      }
      return;
    }
    const card = getCryptogramChoiceCards(compact).find(
      (item) => x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h,
    );
    if (card) selectCryptogramChoice(card.index);
    return;
  }

  if (!isRunning) return;

  if (activeGameId === "cryptogram") {
    const key = getCryptogramKeys(compact).find(
      (item) => x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h,
    );
    if (key) {
      handleCryptogramKey(key.value);
      return;
    }

    const cells = getCryptogramCells(compact);
    const holeByIndex = new Map(cryptogram.puzzle.holes.map((hole, index) => [hole.index, index]));
    const cell = cells.find((item) => x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h);
    if (cell && holeByIndex.has(cell.index)) {
      cryptogram.selected = holeByIndex.get(cell.index);
      cryptogram.message = "下のキーボードで文字を選んでください";
      drawCryptogram();
    }
    return;
  }

  if (activeGameId === "passcode-crack") {
    configureCanvasSize();
    const compact = isPasscodeCompact();
    const button = getPasscodeButtons(compact).find(
      (item) => x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h,
    );
    if (!button) return;
    const value = button.label === "DEL" ? "backspace" : button.label === "ENTER" ? "enter" : button.label;
    handlePasscodeKey(value);
    return;
  }

  if (activeGameId !== "gem-pop") return;

  for (let i = entities.length - 1; i >= 0; i -= 1) {
    const gem = entities[i];
    const distance = Math.hypot(gem.x - x, gem.y - y);
    if (distance <= gem.r * 1.7) {
      score += gem.value;
      entities.splice(i, 1);
      break;
    }
  }
});

window.addEventListener("keydown", (event) => {
  if (activeGameId === "passcode-crack" && isRunning) {
    if (/^\d$/.test(event.key)) {
      handlePasscodeKey(event.key);
      return;
    }
    if (event.key === "Backspace") {
      handlePasscodeKey("backspace");
      return;
    }
    if (event.key === "Enter") {
      handlePasscodeKey("enter");
      return;
    }
  }
  keys.add(event.key);
  keys.add(event.key.toLowerCase());
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
  keys.delete(event.key.toLowerCase());
});

startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", () => switchGame(activeGameId));
fullscreenButton.addEventListener("click", async () => {
  if (!document.fullscreenElement) {
    await gameViewport.requestFullscreen();
    fullscreenButton.textContent = "全画面を終了";
  } else {
    await document.exitFullscreen();
  }
});
changePlayerButton.addEventListener("click", openNameDialog);
heroNameButton.addEventListener("click", openNameDialog);
cancelNameButton.addEventListener("click", () => nameDialog.close());

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.libraryView = button.dataset.view;
    saveState();
    renderGameCards();
  });
});

sortSelect.addEventListener("change", () => {
  state.sortMode = sortSelect.value;
  saveState();
  renderGameCards();
});

gameCardGrid.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.favorite);
    return;
  }

  const card = event.target.closest("[data-open-game]");
  if (card) {
    location.hash = `#play/${card.dataset.openGame}`;
  }
});

gameCardGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest("[data-open-game]");
  if (!card || event.target.closest("[data-favorite]")) return;
  event.preventDefault();
  location.hash = `#play/${card.dataset.openGame}`;
});

nameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = playerNameInput.value.trim().replace(/\s+/g, " ");
  if (!name) return;
  state.playerName = name.slice(0, 14);
  saveState();
  updateProfile();
  renderScoreboards();
  renderGameCards();
  nameDialog.close();
});

document.addEventListener("fullscreenchange", () => {
  configureCanvasSize();
  fullscreenButton.textContent = document.fullscreenElement ? "全画面を終了" : "全画面表示";
  if (activeGameId === "passcode-crack") drawPasscodeCrack();
});

window.addEventListener("resize", () => {
  configureCanvasSize();
  if (activeGameId === "passcode-crack") drawPasscodeCrack();
});

window.addEventListener("hashchange", route);

updateProfile();
renderScoreboards();
renderGameCards();
switchGame(activeGameId);
route();
