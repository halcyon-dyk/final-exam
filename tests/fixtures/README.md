# 강화 이전 저장 검증 사본

38번 작업용 자료다. 실제 사용자 저장을 수집한 백업이 아니라 현재 GameState 형식과 단서 문구에 맞춰 만든 합성 사본이다. 게임 실행 코드에서는 이 파일을 불러오지 않는다.

- `saves-v1.json`: 버전 필드가 없는 기존 저장 9종. 이후 구현에서도 원본 기준 자료로 유지한다.
- `baseline-v1.json`: 별도 Chrome 프로필에서 실제 이어하기 후 관찰한 방·해결 상태·아이템·메모·시간·힌트 값. 공구함 도입 전 배터리 저장은 현재 코드가 이미 적용하는 공구함 완료 보정을 포함한다.
- `../save-fixtures-browser.cjs`: 각 사례마다 새 임시 Chrome 프로필과 테스트 HTTP 서버를 사용한다. 실제 브라우저 프로필이나 Live Server의 저장을 읽거나 덮어쓰지 않는다. SDK는 미지원 응답으로 대체하고 실제 Phaser 장면에서 이어하기를 실행한다.

| ID | 구분 | 시작 상태 | 시간(초) | 힌트 횟수 | 강화판 전력 배분 예상 |
| --- | --- | --- | --- | --- | --- |
| prison | 정상 진행 | 감금실, 상자 단서 발견 | 1134 | 1 | 미해결 |
| maintenance-parts | 정상 진행 | 정비실, 본체만 보유 | 982 | 3 | 미해결 |
| diagram-only | 경계 사례 | 배선도 발견, 통제실 통로 없음 | 851 | 2 | 미해결 |
| passage-open | 정상 진행 | 통로 개방, 아직 정비실 | 804 | 3 | 완료 보정 |
| control-entered | 정상 진행 | 통제실 진입, 기록 미발견 | 733 | 1 | 완료 보정 |
| door-unsolved | 정상 진행 | 배선 해결, 옛 기록 및 비상문 3단계 힌트 | 612 | 5 | 완료 보정 |
| door-open | 정상 진행 | 비상문 개방, 탈출 전 | 504 | 1 | 완료 보정 |
| legacy-battery | 과거 호환 | 공구함 키 없이 본체·배터리 보유 | 903 | 1 | 미해결 |
| no-save | 저장 없음 | 저장 키 자체가 없음 | — | — | 새 게임에서 미해결 |

`diagram-only`는 현재 벽면 조사가 배선도와 통로를 함께 해결하므로 정상 플레이로 남지 않는 합성 경계 사례다. 호환 명세의 별도 분기를 확인하기 위해 포함했다. `no-save`는 JSON `null`을 저장하는 것이 아니라 키가 없는 상태를 뜻한다.

## 자동 기준 검사

프로젝트 루트에서 `node tests/save-fixtures-browser.cjs`를 실행한다. npm 설치나 빌드는 필요 없다. Node.js와 Chrome, Phaser CDN에 접속 가능한 네트워크가 필요하다.

9종 모두 이어하기 활성 여부, 불러온 값, 저장 후 반복 로드, 선택 중인 도구 초기화를 검사한다. 모두 통과한 경우만 기준 관찰 파일을 기록한다. 게임 장면이 열리면 타이머를 일시정지해 수치를 비교한다. 강화판 마이그레이션 구현 후에는 구버전 기준값 파일을 덮어쓰지 말고 별도 강화판 검사로 비교한다.

## Live Server 수동 확인

1. VS Code Live Server로 index.html을 연다. URL을 복사해 **별도 테스트용 브라우저 프로필**에서 연다. 평소 플레이하는 프로필에서는 아래 명령을 실행하지 않는다.
2. 시작 화면에서 개발자 도구 콘솔을 열고 아래 코드를 실행한다. `id`를 표의 사례로 바꾼다. 기존 진행 저장이 있으면 중단하도록 되어 있다.

```js
if (localStorage.getItem('escapeGameState') !== null) {
  throw new Error('기존 저장이 있습니다. 저장이 없는 별도 테스트 프로필을 사용하세요.');
}
const id = 'door-unsolved';
const data = await (await fetch('./tests/fixtures/saves-v1.json')).json();
const fixture = data.cases.find(entry => entry.id === id);
if (!fixture) throw new Error('사례 ID를 확인하세요.');
if (fixture.save !== null) {
  localStorage.setItem('escapeGameState', JSON.stringify(fixture.save));
}
location.reload();
```

3. 이어하기를 누르고 일시정지한다. 방·보관함·메모·힌트를 원본 JSON과 비교한다. 수동 확인 중 흐른 시간은 감안한다. `no-save`에서는 이어하기가 비활성화되어야 한다.
4. 다른 사례는 저장이 없는 별도 테스트 프로필에서 반복한다. 실사용 저장을 지워서 사례를 바꾸지 않는다.

현재 검증은 기존 버전의 읽기 기준 확보다. 전력 퍼즐, 단서 ID, 새 정답, 힌트 무료 재열람, 버전 2 변환 구현 완료를 뜻하지 않는다. 39~52번에서 이 사본을 재사용한다.
