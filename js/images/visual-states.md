# 배경과 게임 요소 조화 점검 — 2026-11-27

제작: 내장 image_gen. [최종 프롬프트](visual-harmony-prompts.md). 기존 파일을 덮어쓰지 않고 새 이미지 5종을 추가했다.

## 실제 사용하는 상태별 파일

| 방 | 상태 | 파일 (프로젝트 루트 기준) | 처리 |
| --- | --- | --- | --- |
| 감금실 | 상자·환풍구 닫힘 | js/images/prison-background-v2.png | 기존 유지 |
| 감금실 | 상자 열림·환풍구 닫힘 | js/images/prison-box-open.png | 기존 유지 |
| 감금실 | 상자·환풍구 열림 | js/images/prison-box-vent-open.png | 기존 유지 |
| 정비실 | 공구함 닫힘 | js/images/maintenance-background-v3.png | 새 이미지: 잠금 덮개로 잘못된 기호 제거 |
| 정비실 | 공구함 열림 | js/images/maintenance-toolbox-open.png | 기존 유지 |
| 정비실 | 공구함 열림·전력 복구 | js/images/maintenance-power-on.png | 새 이미지: 표시등과 통로 조명 |
| 통제실 | 전원 차단·문 닫힘 | js/images/control-power-off-v2.png | 새 이미지 |
| 통제실 | 전원 복구·문 닫힘 | js/images/control-power-on-v2.png | 새 이미지 |
| 통제실 | 전원 복구·문 열림 | js/images/control-door-open-v2.png | 새 이미지 |

통제실은 만화식 외곽선·그림 속 UI를 제거하고 다른 방과 같은 사실적인 낡은 시설 질감으로 교체했다. 각 상태는 동일한 사물 배치를 유지한다. 배선도·전선·실험 기록·시설 지도·비상문은 게임에서 이름표를 표시하며 이름표와 사물 모두 클릭할 수 있다.

감금실 3종은 이미 분위기와 열린 상태가 이어져 유지했다. 정비실 열린 공구함도 기존 이미지를 기준으로 전력 복구본을 제작했다. 시작·성공·실패 화면은 어두운 시설과 금속판 구성으로 기능을 구분하고 있어 유지했다. 퍼즐창의 어두운 금속색·호박색·회백색도 유지했다.

## 확인

- `node tests/power-browser.cjs --visual`: PC 960px, 모바일 320/390px에서 9가지 배경의 로딩·전환·저장 복원·초기화 및 통제실 이름표 경계/겹침 검사, 상태별 스크린샷 생성.
- `node tests/power-browser.cjs --enhanced`: 전체 탈출과 새로고침 후 이어하기.
- `node tests/power-browser.cjs --audit`: 실제 전선·지도 좌표 클릭, 조합·일시정지 회귀 검사.
- `node tests/toolbox-browser.cjs`: 기존 공구함·음향·배경 상태 회귀 검사.
- Live Server: 새 게임의 닫힌 모습 → 공구함/상자 열림 → 전력 복구 → 비상문 열림을 확인한다. 이어하기에서 같은 모습이 유지되고 새 게임에서 닫힘·차단으로 돌아오는지 확인한다.
