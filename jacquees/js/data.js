/* =========================================================
   JACQUEES — data
   - 곡/앨범 메타(커버, 미리듣기 URL)는 iTunes Search API에서 실행 시 불러옵니다.
   - 가사는 LRCLIB(lrclib.net)의 싱크 가사를 실행 시 불러옵니다.
   - 이 파일에는 가사가 들어있지 않습니다.
   ========================================================= */
window.JQ_DATA = {
  artist: {
    name: 'Jacquees',
    realName: 'Rodriquez Jacquees Broadnax',
    pronunciation: 'jah-KWEESS · 자퀴스',
    appleArtistId: 386779763,
    appleUrl: 'https://music.apple.com/us/artist/jacquees/386779763',
    officialUrl: 'https://www.jacqueeslive.com'
  },

  /* 메인 무드 컬러 — Jacquees 분석
     슬로우 잼, 애틀랜타의 밤, 'King of R&B'의 왕관, 촛불 같은 따뜻함 */
  palette: [
    { name: 'Garnet Night', hex: '#5a0f1e', note: '침실 조명처럼 낮게 깔린 와인빛 — 메인 무드' },
    { name: 'Ember',        hex: '#e1695e', note: '보컬의 온기, 무대 위 핀 조명' },
    { name: 'Velvet Plum',  hex: '#2a1238', note: '애틀랜타 새벽 3시의 하늘' },
    { name: 'Candle Gold',  hex: '#c98a4b', note: '“King of R&B”의 왕관' }
  ],

  /* 곡 — id는 iTunes trackId */
  tracks: [
    { id: 1435208602, title: 'B.E.D.', feat: '', album: '4275', year: 2016, dur: 236,
      tag: 'LEAD SINGLE', note: 'Hot 100 #69 · 멀티 플래티넘',
      desc: '데뷔 정규 『4275』의 리드 싱글. 불을 낮춘 방의 공기를 그대로 옮긴 슬로우 잼으로, Jacquees를 메인스트림 R&B 한가운데로 올려놓은 곡.',
      palette: ['#5a0f1e', '#e1695e', '#2a1238'], featured: true },
    { id: 1435209073, title: 'You', feat: '', album: '4275', year: 2018, dur: 218,
      tag: 'CAREER HIGH', note: 'Hot 100 #58 · 멀티 플래티넘',
      desc: '빌보드 Hot 100 58위로 커리어 최고 순위를 기록한 곡. 미니멀한 비트 위에서 보컬 하나로 끝까지 밀어붙인다.',
      palette: ['#3b1a12', '#d7894f', '#1a0f24'], featured: true },
    { id: 1444825528, title: 'At the Club', feat: 'DeJ Loaf', album: 'Fuck a Friend Zone', year: 2017, dur: 171,
      tag: 'DUET', note: 'RIAA 2× Platinum',
      desc: '오랜 파트너 DeJ Loaf와의 첫 합작 믹스테입에서 나온 클럽 R&B. 두 사람의 케미는 2025년 합작 앨범과 투어로 이어진다.',
      palette: ['#2b0f2e', '#c25a7a', '#0f1430'], featured: true },
    { id: 1383351329, title: 'Inside', feat: 'Trey Songz', album: '4275', year: 2018, dur: 248,
      tag: 'FEAT. TREY SONGZ', note: 'RIAA Gold',
      desc: '선배 R&B 스타 Trey Songz와 주고받는 보컬. 『4275』의 관능적인 결을 가장 선명하게 보여준다.',
      palette: ['#1d0d10', '#a8483e', '#2a1a2e'], featured: true },
    { id: 1486717615, title: 'Your Peace', feat: 'Lil Baby', album: 'King of R&B', year: 2019, dur: 184,
      tag: 'KING OF R&B', note: 'RIAA Platinum',
      desc: '애틀랜타 동향 래퍼 Lil Baby가 참여한 『King of R&B』의 대표 싱글. R&B와 트랩이 만나는 지점.',
      palette: ['#101a2a', '#c98a4b', '#3a0d16'], featured: true },
    { id: 1523924247, title: 'Put In Work', feat: 'Chris Brown', album: 'Single', year: 2020, dur: 200,
      tag: 'WITH CHRIS BROWN', note: 'RIAA Gold',
      desc: 'Chris Brown과 함께한 2020년 싱글. 두 보컬리스트의 레이어드 하모니가 곡을 끌고 간다.',
      palette: ['#26130c', '#e1695e', '#120a1c'], featured: true },
    { id: 813766230, title: 'Feel It', feat: 'Rich Homie Quan & Lloyd', album: '19', year: 2014, dur: 260,
      tag: 'EARLY CLASSIC', note: 'RIAA Gold',
      desc: 'EP 『19』 시절의 초기 대표곡. Rich Homie Quan, Lloyd와 함께 애틀랜타 씬에 이름을 알렸다.',
      palette: ['#1c1022', '#b5655a', '#0d0d18'] },
    { id: 1445168988, title: 'Come Thru', feat: 'Rich Homie Quan', album: 'Single', year: 2015, dur: 241,
      tag: 'FAN FAVORITE', note: '',
      desc: 'Cash Money 계약 직후 공개된 싱글. 팬들이 꼽는 초기 명곡.',
      palette: ['#170c18', '#c46a58', '#251020'] },
    { id: 1464012969, title: "Who's", feat: '', album: 'Single', year: 2019, dur: 186,
      tag: 'SINGLE', note: '',
      desc: '2019년 싱글. 질투와 확신 사이를 오가는 전형적인 Jacquees식 러브송.',
      palette: ['#14101e', '#d9785f', '#3a1420'] },
    { id: 1486717603, title: 'Verify', feat: 'Young Thug & Gunna', album: 'King of R&B', year: 2019, dur: 163,
      tag: 'KING OF R&B', note: '',
      desc: 'Young Thug, Gunna와 함께한 『King of R&B』 수록곡. YSL 사운드와 R&B 멜로디의 결합.',
      palette: ['#0f1622', '#9b5a8c', '#2a0f18'] },
    { id: 1655004688, title: 'Tipsy', feat: '', album: 'Sincerely For You', year: 2022, dur: 173,
      tag: 'SINCERELY FOR YOU', note: '',
      desc: 'Future가 총괄 프로듀싱한 세 번째 정규 『Sincerely For You』 수록곡.',
      palette: ['#1e0e16', '#c98a4b', '#101826'] },
    { id: 1793449899, title: 'Just Another Love Song', feat: 'DeJ Loaf', album: 'F**k A Friendzone 2', year: 2024, dur: 208,
      tag: 'FRIENDZONE 2', note: '',
      desc: 'DeJ Loaf와의 합작 앨범 『F**k A Friendzone 2』를 여는 첫 싱글.',
      palette: ['#2a0e22', '#e17a8c', '#120c22'] },
    { id: 6779428977, title: 'Lick Back', feat: 'Juvenile', album: 'Mood 2', year: 2026, dur: 216,
      tag: 'MOOD 2', note: '',
      desc: '뉴올리언스 바운스 위에 Juvenile의 빈티지한 랩 벌스. 뮤직비디오는 Jacquees가 직접 연출했다.',
      palette: ['#2a1608', '#e39a4f', '#14081a'] },
    { id: 6779428971, title: 'Accuse Me', feat: '', album: 'Mood 2', year: 2026, dur: 217,
      tag: 'MOOD 2', note: 'Official video',
      desc: '『MOOD 2』 발매와 함께 공식 뮤직비디오가 공개된 곡. 10년 전 『Mood』의 감성을 지금의 목소리로 다시 꺼낸다.',
      palette: ['#1a0a12', '#e1695e', '#0e1020'] }
  ],

  /* 앨범 — id는 iTunes collectionId */
  albums: [
    { id: 847966653,  title: '19',                   type: 'EP',           date: '2014-03-25', tracks: 11, chart: 'Top R&B Albums #15', play: 813766230 },
    { id: 1441664392, title: 'Lost at Sea 2',         type: 'Mixtape · w/ Birdman', date: '2018-11-16', tracks: 14, chart: '' },
    { id: 1383350993, title: '4275',                 type: 'Studio Album', date: '2018-06-15', tracks: 18, chart: 'Billboard 200 #35 · R&B #3', play: 1435208602 },
    { id: 1486717374, title: 'King of R&B',          type: 'Studio Album', date: '2019-11-08', tracks: 18, chart: 'Billboard 200 #20 · R&B #4', play: 1486717615 },
    { id: 1491425042, title: 'Christmas In Decatur', type: 'EP',           date: '2019-12-13', tracks: 9,  chart: '' },
    { id: 1655004070, title: 'Sincerely For You',    type: 'Studio Album', date: '2022-12-16', tracks: 17, chart: 'Billboard 200 #163', play: 1655004688 },
    { id: 1774626677, title: 'Baby Making',          type: 'Studio Album', date: '2024-11-01', tracks: 10, chart: '' },
    { id: 1795547725, title: 'F**k A Friendzone 2',   type: 'Album · w/ DeJ Loaf', date: '2025-02-14', tracks: 16, chart: '', play: 1793449899 },
    { id: 6779428960, title: 'Mood 2',               type: 'Studio Album', date: '2026-07-31', tracks: 22, chart: 'Cash Money Records', play: 6779428971 }
  ],

  timeline: [
    { y: '2007', tag: 'ORIGIN',     t: '첫 매니저와의 만남',      d: '디케이터의 소년은 첫 매니저 Corey Battle을 만나 탤런트 쇼 무대에 서기 시작한다.' },
    { y: '2011', tag: 'EP',         t: 'I Am Jacquees',          d: '첫 EP와 믹스테입 『Round of Applause』를 독립적으로 발표.' },
    { y: '2014', tag: 'BREAKOUT',   t: '19 · Cash Money',        d: 'EP 『19』가 빌보드 Top R&B Albums 15위로 데뷔. 같은 해 10월 Cash Money Records와 계약, Rich Gang에 합류.' },
    { y: '2016', tag: 'MOOD',       t: 'Mood · B.E.D.',          d: '믹스테입 『Mood』와 Birdman과의 『Lost at Sea』. 싱글 “B.E.D.”가 Hot 100 69위에 오른다.' },
    { y: '2017', tag: 'DUET',       t: 'Fuck a Friend Zone',     d: 'DeJ Loaf와의 합작 믹스테입. “At the Club”이 2× 플래티넘을 기록.' },
    { y: '2018', tag: 'DEBUT LP',   t: '4275',                   d: '데뷔 정규. Billboard 200 35위, R&B 앨범 차트 3위. “You”가 Hot 100 58위로 커리어 하이.' },
    { y: '2019', tag: 'THE CROWN',  t: 'King of R&B',            d: '두 번째 정규로 Billboard 200 20위. 연말엔 홀리데이 EP 『Christmas In Decatur』.' },
    { y: '2020', tag: 'ON THE ROAD',t: 'King of R&B Tour',       d: '30개 도시 투어. Chris Brown과 “Put In Work”, 믹스테입 『Exit 68』 발표.' },
    { y: '2022', tag: 'LP 3',       t: 'Sincerely For You',      d: 'Future가 총괄 프로듀싱한 세 번째 정규.' },
    { y: '2024', tag: 'FATHERHOOD', t: 'Baby Making',            d: '아버지가 된 해. 『19』 10주년 투어와 네 번째 정규 『Baby Making』.' },
    { y: '2025', tag: 'REUNION',    t: 'Friendzone 2',           d: 'DeJ Loaf와의 합작 앨범 『F**k A Friendzone 2』, 그리고 12회의 공동 헤드라이닝 투어.' },
    { y: '2026', tag: 'NOW',        t: 'MOOD 2',                 d: '『Mood』 10주년 리이슈에 이어 22곡의 『MOOD 2』. K Camp와 “Us Over Dem Tour”로 고향 애틀랜타까지.' }
  ],

  tours: [
    { key: 'uod', name: 'Us Over Dem Tour', year: 2026, with: 'w/ K Camp', note: '『MOOD 2』 발매 후 남부·중서부 7개 도시, 피날레는 고향 애틀랜타.',
      shows: [
        ['2026-08-17', 'Phoenix, AZ', 'The Van Buren'],
        ['2026-08-20', 'Dallas, TX', 'South Side Ballroom'],
        ['2026-08-22', 'Houston, TX', 'Bayou Music Center'],
        ['2026-08-26', 'New Orleans, LA', 'The Fillmore'],
        ['2026-08-27', 'Birmingham, AL', 'Avondale Brewing Co.'],
        ['2026-08-28', 'Memphis, TN', 'Graceland Soundstage'],
        ['2026-09-04', 'Atlanta, GA', 'Cellairis Amphitheatre at Lakewood']
      ] },
    { key: 'faf', name: 'F#*K A Friend Zone Tour', year: 2025, with: 'w/ DeJ Loaf', note: 'Live Nation Urban 주최, 4월 5일 ~ 5월 14일 전미 12회 공연 중 일부.',
      shows: [
        ['2025-04-05', 'Wallingford, CT', 'The Dome'],
        ['2025-04-06', 'New York, NY', 'Warsaw'],
        ['2025-04-10', 'Chicago, IL', 'House of Blues'],
        ['2025-04-12', 'Detroit, MI', 'St. Andrews Hall'],
        ['2025-05-14', 'Charlotte, NC', 'Tour finale']
      ] },
    { key: '19', name: '“19” 10-Year Anniversary Tour', year: 2024, with: '', note: '데뷔 EP 『19』 발매 10주년 기념 투어.',
      shows: [
        ['2024-06-01', 'Memphis, TN', 'Minglewood Hall'],
        ['2024-06-02', 'Nashville, TN', 'Cannery Hall'],
        ['2024-06-07', 'Black Mountain, NC', 'Silverados'],
        ['2024-06-12', 'Baltimore, MD', 'Rams Head Live'],
        ['2024-06-20', 'Garden Grove, CA', 'Garden Amp'],
        ['2024-06-21', 'Garden City, ID', 'Revolution'],
        ['2024-06-28', 'New York, NY', 'Webster Hall'],
        ['2024-06-29', 'Cleveland, OH', 'House of Blues'],
        ['2024-07-05', 'New Orleans, LA', 'Essence Festival'],
        ['2024-07-06', 'Houston, TX', 'Warehouse Live'],
        ['2024-07-07', 'Plano, TX', 'Legacy Hall'],
        ['2024-07-14', 'Norfolk, VA', 'The NorVa'],
        ['2024-07-19', 'Minneapolis, MN', 'Skyway Theatre'],
        ['2024-07-21', 'Springfield, MO', 'Regency'],
        ['2024-07-26', 'Birmingham, AL', 'Iron City'],
        ['2024-08-02', 'Seattle, WA', 'Showbox']
      ] },
    { key: 'kor', name: 'King of R&B Tour', year: 2020, with: '', note: '『King of R&B』 발매 기념 30회 투어의 오프닝 공연들.',
      shows: [
        ['2020-01-17', 'San Antonio, TX', 'Aztec Theatre'],
        ['2020-01-19', 'Dallas, TX', 'House of Blues'],
        ['2020-01-20', 'Houston, TX', 'House of Blues']
      ] }
  ],

  /* Concert Archives에 기록된 연도별 공연 수 */
  showsPerYear: [
    [2013, 4], [2014, 3], [2015, 24], [2016, 64], [2017, 24], [2018, 42], [2019, 72],
    [2020, 35], [2021, 11], [2022, 18], [2023, 67], [2024, 38], [2025, 45], [2026, 11]
  ],

  collaborators: [
    'Chris Brown', 'Trey Songz', 'Lil Baby', 'DeJ Loaf', 'Young Thug', 'Gunna', 'Future',
    'Rich Homie Quan', 'Lloyd', 'Birdman', 'K Camp', 'Juvenile', 'Tink', 'Ty Dolla $ign',
    'Kodak Black', 'BLXST', 'Rob49'
  ]
};
