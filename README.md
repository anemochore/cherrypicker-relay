# cherrypicker-relay

## 문제
내 카드를 쓰고 있는 누나에게도 카드 사용 내역을 알려주고 싶다. SMS 이용 내역을 받을 전화번호는 바꿀 수 없는 상황(NH카드는 카드별로 바꿀 수 있는 것 같은데, 하나카드는 안 되는 듯). 

## 아이디어
나는 안드로이드에서 [체리피커 카드가계부](https://play.google.com/store/apps/details?id=kr.plusu.cherrypicker)를 쓰고 있는데, 여기서 기능을 켜면 내 구글 드라이브 특정 폴더에 매일 DB를 백업한다(.db 파일, SQLite 포맷). 그럼 이 폴더를 누나에게만 공유하고, 웹 앱으로 볼 수 있게 하면 어떨까. 원래 아이디어는 [벨로그](https://velog.io/@anemochore/%EC%95%84%EC%9D%B4%EB%94%94%EC%96%B4-%EC%B2%B4%EB%A6%AC%ED%94%BC%EC%BB%A4-%EB%82%B4%EC%97%AD-%EC%A0%84%EB%8B%AC)에 적었었음. 

## 기능
1. gapi로 구글 계정 인증. 누나만 볼 수 있어야 하니까.
2. 내 구글 드라이브에서 가장 최신 체리피커 백업 파일을 찾는다(특정 폴더에서만 찾는 기능은 없는 듯).
3. gapi로 이 파일의 내용을 읽고 Uint8Array로 [sql.js](https://github.com/sql-js/sql.js/)에 전달해서 DB 생성.
4. 이 DB에 해당 카드 사용 내역만 나오게 쿼리를 날린다.
5. 결과를 table로 만들어서 출력.

## 실행
https://anemochore.github.io/cherrypicker-relay/