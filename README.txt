캐릭터 추천 테스트 - 최종 기본 구조

실행:
1. 이 폴더에서 터미널을 엽니다.
2. python -m http.server 8000
3. 브라우저에서 http://localhost:8000 접속

흐름:
공캐/비캐 → 1차 장르 → 세부 장르 → 성격/직업/외형/관계성/랜덤 → 캐릭터 1명 랜덤 추천

캐릭터 추가:
data/characters.json에 객체를 추가하면 됩니다.

필수에 가까운 기본 필드:
id, name, type, genres, subGenres

필터용 배열:
personalities, jobs, appearances, relationships
- 숫자 가중치 없음
- 해당 배열에 적힌 값들이 자동으로 선택 버튼이 됩니다.

선택 필드:
description, quote
- 없어도 정상 작동합니다.

이미지 필드는 사용하지 않습니다.

예시:
{
  "id": "char005",
  "name": "캐릭터 이름",
  "type": "공",
  "genres": ["현대", "인외"],
  "subGenres": ["특수·범죄", "뱀파이어"],
  "personalities": ["다정", "능글"],
  "jobs": ["조폭"],
  "appearances": ["흑발", "장신"],
  "relationships": ["혐관"],
  "description": "선택 사항",
  "quote": "선택 사항"
}
