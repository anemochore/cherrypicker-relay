//globals
const HTML_CONSOLE = document.getElementById('log');
const META = document.getElementById('meta');
const OUTPUT = document.getElementById('content');

console.log2 = (...args) => {
   const t = [...args].join('\n');
  if(t == '')
    HTML_CONSOLE.innerText = 'log cleared.';
  else {
    HTML_CONSOLE.innerText = t;
    console.log(...args);
  }
}


async function run(e) {
  //init
  console.log2('기다리라우...');
  OUTPUT.style.backgroundImage = 'url("spinner.gif")';
  OUTPUT.innerText = 'loading...';

  //get the latest file
  const [id, createdTime] = await getLatestFile();
  if(!id) {
    console.log2('구글 드라이브 폴더에서 파일을 읽을 수 없습니다. :(');
    return;
  }
  META.innerText = new Date(createdTime).toLocaleString() + ' 백업 파일 기준';

  //load it
  const uint8Content = await getUint8(id);

  //load sql
  const SQL = await initSqlJs({
    //locateFile: file => `https://sql.js.org/dist/${file}`
    locateFile: file => `dist/${file}`
  });
  const db = new SQL.Database(uint8Content);  //should be Uint8Array

  //query it
  const header = ['cname', 'cno', 'ymd', 'time', 'paid', 'balance', 'store'];
  const where = `cname = '하나' AND cno = '187-******-09107'`  //hard-coded
  const QUERY = `SELECT ${headers.join(',')} FROM 'TABLE_RECEIPT' WHERE ${where} ORDER BY ymd DESC`;
  const content = db.exec(QUERY);
  console.log(content);

  //make a table
  OUTPUT.style.removeProperty('background-image');
  OUTPUT.innerText = '';

  const styleObj = {
    paid: numberWithCommas,
    balance: numberWithCommas,
  };
  const replaceHeader = {
    cname: '카드/계좌',
    cno: '계좌번호',
    ymd: '날짜',
    time: '시간',
    paid: '금액',
    balance: '잔액',
    store: '적요',
  };
  makeTable(headers, content, OUTPUT, replaceHeader, styleObj);
}


//gapi funcs
async function getLatestFile() {
  const resp = await gapi.client.drive.files.list({
    pageSize: 10,
    orderBy: ['createdTime desc'],
    q: `name contains 'Cherrypicker' and mimeType = 'application/x-sqlite3'`,
    fields: 'files(id, name, createdTime, size)',
  });
  const files = resp.result.files;
  return [files[0]?.id, files[0]?.createdTime];
}

async function getUint8(id) {
  const resp = await gapi.client.drive.files.get({
    fileId: id,
    alt: 'media',
  });

  const charArray = new Array(resp.body.length);
  for (let i = 0; i < resp.body.length; i++) {
    charArray[i] = resp.body.charCodeAt(i);
  }
  return new Uint8Array(charArray);
}


//util
function makeTable(header, rows, target = document.body, replaceHeader = {}, styleObj = {}) {
  //https://stackoverflow.com/a/76501271/6153990
  const newTable = document.createElement("table");
  const thead = document.createElement("thead");
  for(item of headers) {
    const th = document.createElement("th");
    th.textContent = replaceHeader[item] || item;
    thead.appendChild(th);
  }
  newTable.appendChild(thead);

  for(row of rows) {
    const newRow = document.createElement("tr");
    for(header of headers) {
      const td = document.createElement("td");
      if(styleObj[header])
        td.textContent = styleObj[header](row[header]);
      else
        td.textContent = row[header];
      newRow.appendChild(td);
    }
    newTable.appendChild(newRow);
  }

  return target.appendChild(newTable);
}

function numberWithCommas(x) {
  //https://stackoverflow.com/a/2901298/6153990
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


//gapi boilerplates
const CLIENT_ID = '484499455751-m0ck74mc8lkiffj3t6o7p7sk08jerlsk.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAwh4ElKmAhfmTBmdimD9vPAuGws6chirg';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';


/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  gisInited = true;
  maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById('authorize_button').style.visibility = 'visible';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    document.getElementById('signout_button').style.visibility = 'visible';
    document.getElementById('authorize_button').innerText = '다시 로그인';
    await run();
  };

  if (gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({prompt: ''});
  }
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    //document.getElementById('content').innerText = '';
    document.getElementById('authorize_button').innerText = '구글 로그인';
    document.getElementById('signout_button').setAttributestyle.visibility = 'hidden';
  }
}
