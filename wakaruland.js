const default_icons = [
  "",
  "わかる らんど",
  "https://i.gyazo.com/f461f7b9924dbc41ea5a9c745a45e34d.png",
  "https://i.gyazo.com/1fdfa88d9051c938a8dd9b0d28d714f4.png",
  "ＷＩＳＳ に来た",
  "長押しで 表示時間 が変わる", "半角 スペース で改行",
  "笑", "わか る！", "わか らん", "たし かに", "そう かな",
  "すご い！", "いい 話だ", "ひえ ぇ〜", "なる ほど", "まじ かよ",
  "気に なる", "知っ てた", "感動 した",
  "https://i.gyazo.com/e2c6447f25b7c62493552c961c76b1dc.png",
  "https://i.gyazo.com/a4e8bb44169a9c0a18b44ad5da8237c9.png",
  "https://i.gyazo.com/25031cf91e73064ea598acffc06329e5.png",
  "https://i.gyazo.com/b3fe7da8b0d1cbcc5d0281f62793f9ec.png",
  "https://i.gyazo.com/29ac85aa59d449c469cf4eb6e024bf56.png",
  "https://i.gyazo.com/9ac0affa9aa678cb770a0ec86803448c.png",
  "https://i.gyazo.com/55bd9a9ef15d6081bb4631775d87b6c4.png",
  "https://i.gyazo.com/8eab48a46b9bab8e43eb66a47a72d06b.png",
  "https://i.gyazo.com/427c8babba2b3e7561cf752001edaceb.png",
  "https://i.gyazo.com/ce7439e27c5e4049c8b3d2a7227a396f.png",
  "１", "２", "３", "４"
];

// タッチパネル対応判定
const support_touch = 'ontouchend' in document;

// マウス押されているかチェック
let mousedown_cell = "";
let mouseDown = false;
document.body.onmousedown = function(e) {
  if (support_touch || e.button == 0) {
    mouseDown = true;
  }
};
document.body.onmouseup = function(e) {
  if (support_touch || e.button == 0) {
    mouseDown = false;
  }
};

// connect Socket.IO & Linda
const server_url = "https://linda.wakaruland.com";
const socket = io.connect(server_url);
const linda = new Linda().connect(socket);
const ts = linda.tuplespace("wiss2016");

linda.io.on("connect", () => {
  console.log("connect Linda!! https://linda.wakaruland.com");
  const status = document.getElementById("linda_status");
  status.innerHTML = "connection OK";
  status.style.color = "#22aa22";
  // Read
  const cancel_id = ts.read({wakaruland: "reaction", from: my_name}, (err, tuple) => {
    readReaction(tuple);
    setTimeout(() => {
      ts.cancel(cancel_id);
    }, 2000);
  });

  // Watch
  ts.watch({wakaruland: "reaction", from: my_name}, (err, tuple) => {
    readReaction(tuple)
  });
});

linda.io.on("disconnect", () => {
  console.log("disconnect Linda...");
  const status = document.getElementById("linda_status");
  status.innerHTML = "disconnect...";
  status.style.color = "#aa2222";
});

const readReaction = (tuple) => {
  const value = tuple.data.value;
  const img_url = textToImgUrl(value);
  const reaction_unix_time = Math.floor(new Date(tuple.data.time).getTime() / 1000);
  const now_unix_time = Math.floor(new Date().getTime() / 1000);
  const display = (reaction_unix_time + tuple.data.displaytime) - now_unix_time;
  let style;
  if (img_url == "" || value == "" || img_url == "https://i.gyazo.com/f1b6ad7000e92d7c214d49ac3beb33be.png" || display < 2 || display == "") {
    style = "background:url('') center center no-repeat; background-size:contain";
  } else {
    style = "background:url('" + img_url + "') center center no-repeat; background-size:contain";
  }
  document.getElementById("console_reaction_img").setAttribute("style", style);
  withdrawReaction(display);
};

let timer_id;
const withdrawReaction = (time) => {
  window.clearTimeout(timer_id);
  timer_id = window.setTimeout(() => {
    const reaction_style = "background:url('') center center no-repeat; background-size:contain";
    document.getElementById("console_reaction_img").setAttribute("style", reaction_style);
  }, time * 1000); //ミリ秒
};

// テキストからSVG画像を作成
const createSvg = (text) => {
  const text_array = text.split(" ");
  const column_counts = [];
  for (let i in text_array) {
    column_counts.push(Array.from(text_array[i]).length);
  }
  const column_count = Math.max.apply(null, column_counts);
  const row_count = text_array.length;
  const max_text_count = Math.max(column_count, row_count);
  const font_size = 128 / max_text_count;

  let x_coordinate;
  let y_coordinate;
  if (column_count >= row_count) {
    x_coordinate = 0;
    y_coordinate = (114 - (font_size * row_count)) / 2 + font_size;
  } else {
    x_coordinate = (128 - (font_size * column_count)) / 2;
    y_coordinate = font_size - 4;
  }

  let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><g font-size="' + font_size +'px" font-family="YuGothic" font-weight="bold">';
  let i = 0;
  while (i < text_array.length) {
    const y = y_coordinate + (font_size * i);
    const add_text = '<text x="' + x_coordinate + '" y="' + y + '">' + text_array[i] + '</text>';
    svg += add_text;
    i += 1;
  }
  svg += '</g></svg>';
  return svg;
};

const createImage = (svg) => {
  const svg_data_uri = "data:image/svg+xml;utf8;base64," + btoa(unescape(encodeURIComponent(svg)));
  return svg_data_uri;
};

const sendReaction = (img_url, display_time) => {
  if (!(document.getElementById("name_text_box").value)) {
    const reaction_style = "background:url('') center center no-repeat; background-size:contain";
    document.getElementById("console_reaction_img").setAttribute("style", reaction_style);
    return;
  }
  //自分の最新の発言を削除してからwriteする
  const cid = ts.take({from: localStorage.my_name});
  setTimeout( () => {
    ts.cancel(cid);
  }, 2000);

  my_name = document.getElementById("name_text_box").value;
  if (window.localStorage) localStorage.my_name = my_name;
  ts.write({
    wakaruland: "reaction",
    from: my_name,
    displaytime: display_time,
    time: new Date(),
    value: img_url,
  }, {expire: display_time});

  // クリックしたスタンプ画像を先頭に移動
  const stamp_grid = document.getElementById("stamp_grid_view");
  stamp_grid.removeChild(document.getElementById(img_url + "_cell"));
  const my_images = Array.from(new Set(localStorage.images.split(',')));
  my_images.some((v, i) => {
    if (v == img_url) my_images.splice(i, 1);
  });
  my_images.unshift(img_url); //先頭に追加
  localStorage.images = my_images;
  appendStampCell(img_url, false);
};

let mousedown_id;
let mousedown_count = 0;
const startCount = () => {
  const progress = document.getElementById("console_reaction_progress");
  const progress_bar = document.getElementById("console_reaction_progress_bar");
  mousedown_id = setInterval(() => {
    mousedown_count += 1;
    if (mousedown_count <= 30) {
      let display_time = document.getElementById("display_time");
      // mousedown_count 長押し時間（1/10秒）、second 表示時間（秒）
      if (mousedown_count >= 2) {
        progress.style.visibility = "visible";
        progress_bar.style.visibility = "visible";
        progress_bar.style.width = mousedown_count * 3.33 + "%";
      }
      if (mousedown_count <= 3) {
        progress_bar.innerHTML = "20秒";
      } else if (mousedown_count < 10) {
        progress_bar.innerHTML = "1分";
      } else if (mousedown_count < 15) {
        progress_bar.innerHTML = "10分";
      } else if (mousedown_count < 20) {
        progress_bar.innerHTML = "1時間";
      } else if (mousedown_count < 25) {
        progress_bar.innerHTML = "6時間";
      } else if (mousedown_count < 30) {
        progress_bar.innerHTML = "12時間";
      } else {
        progress_bar.innerHTML = "24時間";
      }
    }
  }, 100);
};

// スタンプの一覧に画像を追加する
const appendStampCell = (value, append_last) => {
  const down = support_touch ? "touchstart" : "mousedown";
  const up = support_touch ? "touchend" : "mouseup";

  let img_url;
  let id;
  let cell;
  if (value.match('^(https?|ftp)')) {
    img_url = value;
    cell = document.createElement("div");
    cell.setAttribute("class", "stamp_cell");
    cell.setAttribute("id", img_url + "_cell");
    const cell_style = "background:url('" + img_url + "') center center no-repeat; background-size:contain; background-color: #ffffff;";
    cell.setAttribute("style", cell_style);
    cell.addEventListener(down, (e) => {
      if (support_touch || e.button == 0) {
        mousedown_cell = value;
        startCount(img_url);
        const reaction_style = "background:url('" + img_url + "') center center no-repeat; background-size:contain";
        document.getElementById("console_reaction_img").setAttribute("style", reaction_style);
      }
    });
  } else {
    img_url = createImage(createSvg(value));
    cell = document.createElement("div");
    cell.setAttribute("class", "stamp_cell");
    cell.setAttribute("id", value + "_cell");
    const cell_style = "background:url('" + img_url + "') center center no-repeat; background-size:contain; background-color: #ffffff;";
    cell.setAttribute("style", cell_style);
    cell.addEventListener(down, (e) => {
      if (support_touch || e.button == 0) {
        mousedown_cell = value;
        startCount(img_url);
        const reaction_style = "background:url('" + img_url + "') center center no-repeat; background-size:contain";
        document.getElementById("console_reaction_img").setAttribute("style", reaction_style);
      }
    });
  }

  const delete_button = document.createElement("img");
  delete_button.setAttribute("class", "cell_delete_button");
  delete_button.setAttribute("width", "20px");
  delete_button.setAttribute("src", "images/delete.png");
  delete_button.addEventListener(down, (e) => {
    displayDeleteDialog(value);
    e.stopPropagation();
  });
  if (support_touch) {
    delete_button.style.display = "inline";
  } else {
    cell.addEventListener("mouseover", function() {
      delete_button.style.display = "inline";
    });
    cell.addEventListener("mouseout", function() {
      delete_button.style.display = "none";
      if (mouseDown) {
        mousedown_cell = "";
        clearInterval(mousedown_id);
        mousedown_count = 0;
        const progress = document.getElementById("console_reaction_progress");
        const progress_bar = document.getElementById("console_reaction_progress_bar");
        progress.style.visibility = "hidden";
        progress_bar.style.visibility = "hidden";
        progress_bar.style.width = 0;
        const reaction_style = "background:url('') center center no-repeat; background-size:contain";
        document.getElementById("console_reaction_img").setAttribute("style", reaction_style);
      }
    });
  }
  cell.appendChild(delete_button);

  cell.addEventListener(up, () => {
    if (mousedown_cell == value) {
      mousedown_cell = "";
      clearInterval(mousedown_id);
      let display_time;
      if (mousedown_count <= 3) {
        display_time = 20;
      } else if (mousedown_count < 10) {
        display_time = 60;
      } else if (mousedown_count < 15) {
        display_time = 600;
      } else if (mousedown_count < 20) {
        display_time = 3600;
      } else if (mousedown_count < 25) {
        display_time = 21600;
      } else if (mousedown_count < 30) {
        display_time = 43200;
      } else {
        display_time = 86400;
      }
      if (value.match('^(https?|ftp)')) {
        sendReaction(img_url, display_time);
      } else {
        sendReaction(value, display_time);
      }
      mousedown_count = 0;
      const progress = document.getElementById("console_reaction_progress");
      const progress_bar = document.getElementById("console_reaction_progress_bar");
      progress.style.visibility = "hidden";
      progress_bar.style.visibility = "hidden";
      progress_bar.style.width = 0;
    }
  });

  if (append_last) {
    document.getElementById("stamp_grid_view").appendChild(cell);
  } else {
    const stamp_grid_view = document.getElementById("stamp_grid_view");
    stamp_grid_view.insertBefore(cell, stamp_grid_view.firstChild);
  }
};

// 自分で追加した画像を削除
const removeStampImage = (img_url) => {
  const stamp_grid = document.getElementById("stamp_grid_view");
  // TODO: elementの存在チェック
  stamp_grid.removeChild(document.getElementById(img_url + "_cell"));
  const my_images = Array.from(new Set(localStorage.images.split(',')));
  my_images.some((v, i) => {
    if (v == img_url) my_images.splice(i, 1);
  });
  localStorage.images = my_images;
};

// URLから画像を追加
const addStampImage = (img_url) => {
  let my_images = Array.from(new Set(localStorage.images.split(',')));
  if (my_images.includes(img_url)) {
    const stamp_grid = document.getElementById("stamp_grid_view");
    stamp_grid.removeChild(document.getElementById(img_url + "_cell"));
    const my_images = Array.from(new Set(localStorage.images.split(',')));
    my_images.some((v, i) => {
      if (v == img_url) my_images.splice(i, 1);
    });
  }
  my_images.unshift(img_url); //先頭に追加
  localStorage.images = my_images;
  appendStampCell(img_url, false);
};

const displayDeleteDialog = (img_url) => {
  if (window.confirm(img_url + "\nを削除します。よろしいですか？")) {
    removeStampImage(img_url);
  }
};

const toZenkaku = (strVal) => {
  const value = strVal.replace(/[!-~]/g,
      function( tmpStr ) {
        return String.fromCharCode(tmpStr.charCodeAt(0) + 0xFEE0);
      }
  );

  return value.replace(/”/g, "\"")
      .replace(/'/g, "’")
      .replace(/`/g, "｀")
      .replace(/\\/g, "＼")
      .replace(/~/g, "〜");
};

const addStampFromTextBox = () => {
  const value = document.getElementById("image_url_text_box").value;
  let image_url;
  if (value.match('^https://gyazo.com')) {
    image_url = value + ".png";
  } else if (value.match('^(https?|ftp).+?\.(jpg|jpeg|png|gif|bmp|svg)')) {
    image_url = value;
  } else {
    image_url = toZenkaku(value);
  }
  if (image_url) {
    addStampImage(image_url);
    document.getElementById("image_url_text_box").value = "";
  }
};

// テキストを渡すと画像のURLが返ってくる
const textToImgUrl = (text) => {
  let url;
  if (text.match('^https://gyazo.com')) {
    url = text + ".png";
  } else if (text.match('^(https?|ftp).+?\.(jpg|jpeg|png|gif|bmp|svg)')) {
    url = text;
  } else {
    url = createImage(createSvg(toZenkaku(text)));
  }
  return url;
};

/**
 *  ここから下はページを開いた時に実行されるもの
 */
let my_name = "";
my_name = localStorage.my_name || my_name;
document.getElementById("name_text_box").value = my_name;

// localStorageから自分で追加した画像を表示
if (localStorage.images == null || localStorage.images == "") {
  localStorage.images = default_icons;
}

const appendStampFromLocalStorage = (() => {
  const my_images = Array.from(new Set(localStorage.images.split(',')));
  for (let i in my_images) {
    appendStampCell(my_images[i], true);
  }
  localStorage.images = Array.from(new Set(my_images));
})();

document.getElementById("image_url_text_box").addEventListener("keydown", function(e){
  if(e.which && e.which === 13 || e.keyCode && e.keyCode === 13) {
    addStampFromTextBox();
  }
});

document.getElementById("reload_button").addEventListener("click", () => {
  location.reload();
});

document.getElementById("reload_button").addEventListener("mouseover", () => {
  document.getElementById("reload_caption").style.display = "inline";
});

document.getElementById("reload_button").addEventListener("mouseout", () => {
  document.getElementById("reload_caption").style.display = "none";
});
