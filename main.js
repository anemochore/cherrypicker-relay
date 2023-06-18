//log singleton
const HTML_CONSOLE = document.getElementById('log');
console.log2 = (...args) => {
   const t = [...args].join('\n');
  if(t == '')
    HTML_CONSOLE.innerText = 'log cleared.';
  else {
    HTML_CONSOLE.innerText = t;
    console.log(...args);
  }
}

//load sql.js
//const initSqlJs = window.initSqlJs;
const SQL = initSqlJs({
  //locateFile: file => `https://sql.js.org/dist/${file}`
  locateFile: file => `dist/${file}`
});


async function run(e) {
  //init
  console.log2('기다리라우...');
  const output = document.getElementById('output');
  output.style.backgroundImage = 'url("spinner.gif")';
  output.alt = 'loading...';

  //get folder
  //const folder = await getFolder();
  folder = {id: '1ZB7TC1sYyYOCUaeIFiXJpb5fCLJeirf7'};  //dev
  if(!folder.id) {
    console.log2('구글 드라이브에서 폴더를 읽을 수 없습니다. :(', folder);
    //todo: 폴더를 수동으로 고르게 해주자??
    return;
  }

  //get the latest file
  /*
  const file = await getLatestFile(folder.id);
  if(!file.id) {
    console.log2('구글 드라이브 폴더에서 파일을 읽을 수 없습니다. :(', folder);
    //todo: 폴더를 수동으로 고르게 해주자??
    return;
  }
  */

  //load it
  file = {id: '1AeLjyBb6pExwYcvVRsIRz8gC7l7FrqxZ'};  //dev
  const url = getUrl(file.id);
  //url = 'https://github.com/lerocha/chinook-database/raw/master/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite';  //dev
  const db = loadSql(url);

  //query it
  const content = db.exec("SELECT * FROM my_table");
  console.log(content);

  //
}


async function getFolder() {
  return;
}

async function getLatestFile(folder) {
  return;
}

async function getUrl(id) {
  //https://stackoverflow.com/a/39408884/6153990
  gapi.client.drive.files.get({
    fileId: id,
    fields: 'webContentLink'
  }).then(function(success){
      const webContentLink = success.result.webContentLink; //the link is in the success.result object
      return webContentLink;
  }, function(fail){
      console.log(fail);
      console.log('Error: ', fail.result.error.message);
  })
}

async function loadSql(url) {
  const dataPromise = fetch(url).then(res => res.arrayBuffer());
  const buf = await Promise(dataPromise)
  const db = new SQL.Database(new Uint8Array(buf));
  return db;
}


//gapi boilerplates
google.accounts.id.initialize({
  client_id: '484499455751-m0ck74mc8lkiffj3t6o7p7sk08jerlsk.apps.googleusercontent.com',
  callback: run
});
google.accounts.id.prompt();
