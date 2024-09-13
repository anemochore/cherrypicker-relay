//globals
const META = document.getElementById('meta');
const OUTPUT = document.getElementById('content');

async function run(e) {
  //init
  OUTPUT.style.backgroundImage = 'url("spinner.gif")';
  OUTPUT.innerText = 'loading...';

  //get the latest file
  const [id, createdTime] = await getLatestFile();
  if(!id) {
    windows.alert('구글 드라이브에서 파일을 읽을 수 없습니다. :(');
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
  const where = [
    `cname = '하나' AND cno = '187-******-09107'`,
    `cname = '하나카드' AND cno = '4*3*'`,
  ].join(' OR ').replace(/ OR $/, '');
  const QUERY = `SELECT ${header.join(',')} FROM 'TABLE_RECEIPT' WHERE ${where} ORDER BY _id DESC`;
  const content = db.exec(QUERY);
  //console.log(content);

  //make a table
  OUTPUT.style.removeProperty('background-image');
  OUTPUT.innerText = '';

  const rows = content[0].values;
  const styleObj = {
    paid: numberWithCommas,
    balance: numberWithCommas,
  };
  const replaceHeader = {
    cname: '은행',
    cno: '계좌번호',
    ymd: '날짜',
    time: '시간',
    paid: '금액',
    balance: '잔액',
    store: '적요',
  };
  makeTable(header, rows, OUTPUT, replaceHeader, styleObj);
}


//gapi funcs
async function getLatestFile() {
  const resp = await gapi.client.drive.files.list({
    pageSize: 10,
    orderBy: ['createdTime desc'],
    q: `name contains 'Cherrypicker' and mimeType = 'application/x-sqlite3'`,
    //fields: 'files(id, name, createdTime, size)',
    fields: 'files(id, createdTime)',
  });
  const files = resp.result.files;
  return [files[0]?.id, files[0]?.createdTime];
}

async function getUint8(id) {
  const resp = await gapi.client.drive.files.get({
    fileId: id,
    alt: 'media',
  });

  //https://stackoverflow.com/a/63818644/6153990
  const charArray = new Array(resp.body.length);
  for (let i = 0; i < resp.body.length; i++) {
    charArray[i] = resp.body.charCodeAt(i);
  }
  return new Uint8Array(charArray);
}


//utils
function makeTable(header, rows, target = document.body, replaceHeader = {}, styleObj = {}) {
  //https://stackoverflow.com/a/76501271/6153990
  const newTable = document.createElement("table");
  const thead = document.createElement("thead");
  for(item of header) {
    const th = document.createElement("th");
    th.textContent = replaceHeader[item] || item;
    thead.appendChild(th);
  }
  newTable.appendChild(thead);

  for(row of rows) {
    const newRow = document.createElement("tr");
    row.forEach((item, i) => {
      const td = document.createElement("td");
      if(styleObj[header[i]])
        td.textContent = styleObj[header[i]](item);
      else
        td.textContent = item;
      //console.log(td);
      newRow.appendChild(td);
    });
    newTable.appendChild(newRow);
  }

  return target.appendChild(newTable);
}

function numberWithCommas(x) {
  //https://stackoverflow.com/a/2901298/6153990
  return x?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


//get CLIENT_ID & API_KEY (stored in github repo secrets). how awkard...
var API_KEY   = (await(await fetch('./API_KEY.env')).text()).trim();
var CLIENT_ID = (await(await fetch('./CLIENT_ID.env')).text()).trim();

//gapi boilerplates
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
    document.getElementById('authorize_button').innerText = '새로고침';
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
