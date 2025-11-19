export interface FamilyNode {
  id: string;
  data: {
    "first name": string;
    "last name": string;
    birthday: string;
    avatar: string;
    gender: "M" | "F";
  };
  rels: {
    father?: string;
    mother?: string;
    spouses?: string[];
    children?: string[];
  };
}

export const familyTreeData: FamilyNode[] = [
      {
        id: "duddley_isaac",
        data: {
          "first name": "Duddley",
          "last name": "Isaac",
          birthday: "1920",
          avatar: "https://i.pravatar.cc/150?img=12",
          gender: "M",
        },
        rels: {
          spouses: ["dorris_isaac"],
          children: ["russell_isaac"],
        },
      },
      {
        id: "dorris_isaac",
        data: {
          "first name": "Dorris",
          "last name": "Isaac",
          birthday: "1922",
          avatar: "https://i.pravatar.cc/150?img=45",
          gender: "F",
        },
        rels: {
          spouses: ["duddley_isaac"],
          children: ["russell_isaac"],
        },
      },
      {
        id: "eric_gomez",
        data: {
          "first name": "Eric",
          "last name": "Gomez",
          birthday: "1918",
          avatar: "https://i.pravatar.cc/150?img=33",
          gender: "M",
        },
        rels: {
          spouses: ["joyce_gomez"],
          children: ["yvonne_oliver", "carlton_gomez", "elmo_gomez", "valley_gomez", "nobert_gomez"],
        },
      },
      {
        id: "joyce_gomez",
        data: {
          "first name": "Joyce",
          "last name": "Gomez",
          birthday: "1920",
          avatar: "https://i.pravatar.cc/150?img=47",
          gender: "F",
        },
        rels: {
          spouses: ["eric_gomez"],
          children: ["yvonne_oliver", "carlton_gomez", "elmo_gomez", "valley_gomez", "nobert_gomez"],
        },
      },
      {
        id: "duddley_hale",
        data: {
          "first name": "Duddley",
          "last name": "Hale",
          birthday: "1921",
          avatar: "https://i.pravatar.cc/150?img=52",
          gender: "M",
        },
        rels: {
          spouses: ["carmen_hale"],
          children: ["tyronne_hale"],
        },
      },
      {
        id: "carmen_hale",
        data: {
          "first name": "Carmen",
          "last name": "Hale",
          birthday: "1923",
          avatar: "https://i.pravatar.cc/150?img=29",
          gender: "F",
        },
        rels: {
          spouses: ["duddley_hale"],
          children: ["tyronne_hale"],
        },
      },

      // Generation -1 (Parents)
      {
        id: "russell_isaac",
        data: {
          "first name": "Russell",
          "last name": "Isaac",
          birthday: "1945",
          avatar: "https://i.pravatar.cc/150?img=68",
          gender: "M",
        },
        rels: {
          father: "duddley_isaac",
          mother: "dorris_isaac",
          spouses: ["audrey_isaac"],
          children: ["neil_isaac", "keith_isaac", "lloyd_isaac"],
        },
      },
      {
        id: "audrey_isaac",
        data: {
          "first name": "Audrey",
          "last name": "Isaac",
          birthday: "1947",
          avatar: "https://i.pravatar.cc/150?img=44",
          gender: "F",
        },
        rels: {
          spouses: ["russell_isaac"],
          children: ["neil_isaac", "keith_isaac", "lloyd_isaac"],
        },
      },
      {
        id: "sandra_periera",
        data: {
          "first name": "Sandra",
          "last name": "Periera",
          birthday: "1948",
          avatar: "https://i.pravatar.cc/150?img=36",
          gender: "F",
        },
        rels: {
          spouses: ["godfrey_periera"],
          children: ["alistair_periera", "candice_periera"],
        },
      },
      {
        id: "godfrey_periera",
        data: {
          "first name": "Godfrey",
          "last name": "Periera",
          birthday: "1946",
          avatar: "https://i.pravatar.cc/150?img=15",
          gender: "M",
        },
        rels: {
          spouses: ["sandra_periera"],
          children: ["alistair_periera", "candice_periera"],
        },
      },
      {
        id: "lynn_godfrey",
        data: {
          "first name": "Lynn",
          "last name": "Godfrey",
          birthday: "1950",
          avatar: "https://i.pravatar.cc/150?img=38",
          gender: "F",
        },
        rels: {
          spouses: ["rudolph_godfrey"],
          children: ["ryan_godfrey", "gordon_godfrey"],
        },
      },
      {
        id: "rudolph_godfrey",
        data: {
          "first name": "Rudolph",
          "last name": "Godfrey",
          birthday: "1948",
          avatar: "https://i.pravatar.cc/150?img=56",
          gender: "M",
        },
        rels: {
          spouses: ["lynn_godfrey"],
          children: ["ryan_godfrey", "gordon_godfrey"],
        },
      },
      {
        id: "yvonne_oliver",
        data: {
          "first name": "Yvonne",
          "last name": "Oliver",
          birthday: "1949",
          avatar: "https://i.pravatar.cc/150?img=25",
          gender: "F",
        },
        rels: {
          father: "eric_gomez",
          mother: "joyce_gomez",
          spouses: ["edward_oliver"],
          children: ["adrian_oliver", "jennifer_oliver"],
        },
      },
      {
        id: "edward_oliver",
        data: {
          "first name": "Edward",
          "last name": "Oliver",
          birthday: "1947",
          avatar: "https://i.pravatar.cc/150?img=60",
          gender: "M",
        },
        rels: {
          spouses: ["yvonne_oliver"],
          children: ["adrian_oliver", "jennifer_oliver"],
        },
      },
      {
        id: "carlton_gomez",
        data: {
          "first name": "Carlton",
          "last name": "Gomez",
          birthday: "1951",
          avatar: "https://i.pravatar.cc/150?img=13",
          gender: "M",
        },
        rels: {
          father: "eric_gomez",
          mother: "joyce_gomez",
          spouses: ["effie_gomez"],
          children: ["fauna_gomez", "zane_gomez"],
        },
      },
      {
        id: "effie_gomez",
        data: {
          "first name": "Effie",
          "last name": "Gomez",
          birthday: "1953",
          avatar: "https://i.pravatar.cc/150?img=26",
          gender: "F",
        },
        rels: {
          spouses: ["carlton_gomez"],
          children: ["fauna_gomez", "zane_gomez"],
        },
      },
      {
        id: "june_hickman",
        data: {
          "first name": "June",
          "last name": "Hickman",
          birthday: "1952",
          avatar: "https://i.pravatar.cc/150?img=31",
          gender: "F",
        },
        rels: {
          father: "eric_gomez",
          mother: "joyce_gomez",
          spouses: ["peter_hickman"],
          children: ["jehu_abhiram", "zubin_hickman"],
        },
      },
      {
        id: "peter_hickman",
        data: {
          "first name": "Peter",
          "last name": "Hickman",
          birthday: "1950",
          avatar: "https://i.pravatar.cc/150?img=70",
          gender: "M",
        },
        rels: {
          spouses: ["june_hickman"],
          children: ["jehu_abhiram", "zubin_hickman"],
        },
      },
      {
        id: "elmo_gomez",
        data: {
          "first name": "Elmo",
          "last name": "Gomez",
          birthday: "1954",
          avatar: "https://i.pravatar.cc/150?img=14",
          gender: "M",
        },
        rels: {
          father: "eric_gomez",
          mother: "joyce_gomez",
          spouses: ["patsy_gomez"],
          children: ["savio_gomez", "ena_gomez"],
        },
      },
      {
        id: "patsy_gomez",
        data: {
          "first name": "Patsy",
          "last name": "Gomez",
          birthday: "1956",
          avatar: "https://i.pravatar.cc/150?img=32",
          gender: "F",
        },
        rels: {
          spouses: ["elmo_gomez"],
          children: ["savio_gomez", "ena_gomez"],
        },
      },
      {
        id: "valley_gomez",
        data: {
          "first name": "Valley",
          "last name": "Gomez",
          birthday: "1955",
          avatar: "https://i.pravatar.cc/150?img=17",
          gender: "M",
        },
        rels: {
          father: "eric_gomez",
          mother: "joyce_gomez",
          spouses: ["brenda_gomez"],
          children: ["frank_gomez", "vincent_gomez"],
        },
      },
      {
        id: "brenda_gomez",
        data: {
          "first name": "Brenda",
          "last name": "Gomez",
          birthday: "1957",
          avatar: "https://i.pravatar.cc/150?img=27",
          gender: "F",
        },
        rels: {
          spouses: ["valley_gomez"],
          children: ["frank_gomez", "vincent_gomez"],
        },
      },
      {
        id: "nobert_gomez",
        data: {
          "first name": "Nobert",
          "last name": "Gomez",
          birthday: "1958",
          avatar: "https://i.pravatar.cc/150?img=51",
          gender: "M",
        },
        rels: {
          father: "eric_gomez",
          mother: "joyce_gomez",
          spouses: ["sharon_gomez"],
          children: ["gail_gomez", "steffie_gomez"],
        },
      },
      {
        id: "sharon_gomez",
        data: {
          "first name": "Sharon",
          "last name": "Gomez",
          birthday: "1960",
          avatar: "https://i.pravatar.cc/150?img=43",
          gender: "F",
        },
        rels: {
          spouses: ["nobert_gomez"],
          children: ["gail_gomez", "steffie_gomez"],
        },
      },
      {
        id: "tyronne_hale",
        data: {
          "first name": "Tyronne",
          "last name": "Hale",
          birthday: "1950",
          avatar: "https://i.pravatar.cc/150?img=59",
          gender: "M",
        },
        rels: {
          father: "duddley_hale",
          mother: "carmen_hale",
          spouses: ["janet_hale"],
          children: ["natalie_isaac", "travis_hale"],
        },
      },
      {
        id: "janet_hale",
        data: {
          "first name": "Janet",
          "last name": "Hale",
          birthday: "1952",
          avatar: "https://i.pravatar.cc/150?img=40",
          gender: "F",
        },
        rels: {
          spouses: ["tyronne_hale"],
          children: ["natalie_isaac", "travis_hale"],
        },
      },
      {
        id: "dino_culleden",
        data: {
          "first name": "Dino",
          "last name": "Culleden",
          birthday: "1948",
          avatar: "https://i.pravatar.cc/150?img=66",
          gender: "M",
        },
        rels: {
          spouses: ["clinton_culleden"],
          children: ["christine_culleden", "christopher_culleden", "golu_culleden", "virginia_culleden"],
        },
      },
      {
        id: "clinton_culleden",
        data: {
          "first name": "Clinton",
          "last name": "Culleden",
          birthday: "1950",
          avatar: "https://i.pravatar.cc/150?img=20",
          gender: "M",
        },
        rels: {
          spouses: ["dino_culleden"],
          children: ["christine_culleden", "christopher_culleden", "golu_culleden", "virginia_culleden"],
        },
      },
      {
        id: "rosland_vanmanen",
        data: {
          "first name": "Rosland",
          "last name": "Vanmanen",
          birthday: "1951",
          avatar: "https://i.pravatar.cc/150?img=48",
          gender: "F",
        },
        rels: {
          spouses: ["leon_vanmanen"],
          children: ["darren_vanmanen", "lynette_vanmanen"],
        },
      },
      {
        id: "leon_vanmanen",
        data: {
          "first name": "Leon",
          "last name": "Vanmanen",
          birthday: "1949",
          avatar: "https://i.pravatar.cc/150?img=54",
          gender: "M",
        },
        rels: {
          spouses: ["rosland_vanmanen"],
          children: ["darren_vanmanen", "lynette_vanmanen"],
        },
      },
      {
        id: "patricia_vanmanen",
        data: {
          "first name": "Patricia",
          "last name": "Vanmanen",
          birthday: "1953",
          avatar: "https://i.pravatar.cc/150?img=41",
          gender: "F",
        },
        rels: {
          spouses: ["jimmy_vanmanen"],
          children: ["janice_vanmanen", "nattu_vanmanen"],
        },
      },
      {
        id: "jimmy_vanmanen",
        data: {
          "first name": "Jimmy",
          "last name": "Vanmanen",
          birthday: "1951",
          avatar: "https://i.pravatar.cc/150?img=69",
          gender: "M",
        },
        rels: {
          spouses: ["patricia_vanmanen"],
          children: ["janice_vanmanen", "nattu_vanmanen"],
        },
      },

      // Generation 0 (Current Generation - User's Generation)
      {
        id: "neil_isaac",
        data: {
          "first name": "Neil",
          "last name": "Isaac",
          birthday: "1970",
          avatar: "https://i.pravatar.cc/150?img=11",
          gender: "M",
        },
        rels: {
          father: "russell_isaac",
          mother: "audrey_isaac",
          spouses: ["yolen_isaac"],
          children: ["dwain_isaac"],
        },
      },
      {
        id: "yolen_isaac",
        data: {
          "first name": "Yolen",
          "last name": "Isaac",
          birthday: "1972",
          avatar: "https://i.pravatar.cc/150?img=23",
          gender: "F",
        },
        rels: {
          spouses: ["neil_isaac"],
          children: ["dwain_isaac"],
        },
      },
      {
        id: "keith_isaac",
        data: {
          "first name": "Keith",
          "last name": "Isaac",
          birthday: "1972",
          avatar: "https://i.pravatar.cc/150?img=58",
          gender: "M",
        },
        rels: {
          father: "russell_isaac",
          mother: "audrey_isaac",
          spouses: ["natalie_isaac"],
          children: ["aarya_isaac", "frank_isaac"],
        },
      },
      {
        id: "natalie_isaac",
        data: {
          "first name": "Natalie",
          "last name": "Isaac",
          birthday: "1975",
          avatar: "https://i.pravatar.cc/150?img=30",
          gender: "F",
        },
        rels: {
          father: "tyronne_hale",
          mother: "janet_hale",
          spouses: ["keith_isaac"],
          children: ["aarya_isaac", "frank_isaac"],
        },
      },
      {
        id: "lloyd_isaac",
        data: {
          "first name": "Lloyd",
          "last name": "Isaac",
          birthday: "1974",
          avatar: "https://i.pravatar.cc/150?img=67",
          gender: "M",
        },
        rels: {
          father: "russell_isaac",
          mother: "audrey_isaac",
          spouses: ["sharon_fernandes"],
        },
      },
      {
        id: "sharon_fernandes",
        data: {
          "first name": "Sharon",
          "last name": "Fernandes",
          birthday: "1976",
          avatar: "https://i.pravatar.cc/150?img=24",
          gender: "F",
        },
        rels: {
          spouses: ["lloyd_isaac"],
        },
      },
      {
        id: "alistair_periera",
        data: {
          "first name": "Alistair",
          "last name": "Periera",
          birthday: "1973",
          avatar: "https://i.pravatar.cc/150?img=61",
          gender: "M",
        },
        rels: {
          father: "godfrey_periera",
          mother: "sandra_periera",
        },
      },
      {
        id: "candice_periera",
        data: {
          "first name": "Candice",
          "last name": "Periera",
          birthday: "1975",
          avatar: "https://i.pravatar.cc/150?img=35",
          gender: "F",
        },
        rels: {
          father: "godfrey_periera",
          mother: "sandra_periera",
        },
      },
      {
        id: "ryan_godfrey",
        data: {
          "first name": "Ryan",
          "last name": "Godfrey",
          birthday: "1976",
          avatar: "https://i.pravatar.cc/150?img=64",
          gender: "M",
        },
        rels: {
          father: "rudolph_godfrey",
          mother: "lynn_godfrey",
        },
      },
      {
        id: "gordon_godfrey",
        data: {
          "first name": "Gordon",
          "last name": "Godfrey",
          birthday: "1978",
          avatar: "https://i.pravatar.cc/150?img=62",
          gender: "M",
        },
        rels: {
          father: "rudolph_godfrey",
          mother: "lynn_godfrey",
        },
      },
      {
        id: "adrian_oliver",
        data: {
          "first name": "Adrian",
          "last name": "Oliver",
          birthday: "1974",
          avatar: "https://i.pravatar.cc/150?img=57",
          gender: "M",
        },
        rels: {
          father: "edward_oliver",
          mother: "yvonne_oliver",
        },
      },
      {
        id: "jennifer_oliver",
        data: {
          "first name": "Jennifer",
          "last name": "Oliver",
          birthday: "1976",
          avatar: "https://i.pravatar.cc/150?img=22",
          gender: "F",
        },
        rels: {
          father: "edward_oliver",
          mother: "yvonne_oliver",
        },
      },
      {
        id: "fauna_gomez",
        data: {
          "first name": "Fauna",
          "last name": "Gomez",
          birthday: "1977",
          avatar: "https://i.pravatar.cc/150?img=28",
          gender: "F",
        },
        rels: {
          father: "carlton_gomez",
          mother: "effie_gomez",
        },
      },
      {
        id: "zane_gomez",
        data: {
          "first name": "Zane",
          "last name": "Gomez",
          birthday: "1979",
          avatar: "https://i.pravatar.cc/150?img=65",
          gender: "M",
        },
        rels: {
          father: "carlton_gomez",
          mother: "effie_gomez",
        },
      },
      {
        id: "jehu_abhiram",
        data: {
          "first name": "Jehu",
          "last name": "Abhiram",
          birthday: "1978",
          avatar: "https://i.pravatar.cc/150?img=63",
          gender: "M",
        },
        rels: {
          father: "peter_hickman",
          mother: "june_hickman",
        },
      },
      {
        id: "zubin_hickman",
        data: {
          "first name": "Zubin",
          "last name": "Hickman",
          birthday: "1980",
          avatar: "https://i.pravatar.cc/150?img=55",
          gender: "M",
        },
        rels: {
          father: "peter_hickman",
          mother: "june_hickman",
        },
      },
      {
        id: "savio_gomez",
        data: {
          "first name": "Savio",
          "last name": "Gomez",
          birthday: "1981",
          avatar: "https://i.pravatar.cc/150?img=53",
          gender: "M",
        },
        rels: {
          father: "elmo_gomez",
          mother: "patsy_gomez",
        },
      },
      {
        id: "ena_gomez",
        data: {
          "first name": "Ena",
          "last name": "Gomez",
          birthday: "1983",
          avatar: "https://i.pravatar.cc/150?img=21",
          gender: "F",
        },
        rels: {
          father: "elmo_gomez",
          mother: "patsy_gomez",
        },
      },
      {
        id: "frank_gomez",
        data: {
          "first name": "Frank",
          "last name": "Gomez",
          birthday: "1982",
          avatar: "https://i.pravatar.cc/150?img=50",
          gender: "M",
        },
        rels: {
          father: "valley_gomez",
          mother: "brenda_gomez",
        },
      },
      {
        id: "vincent_gomez",
        data: {
          "first name": "Vincent",
          "last name": "Gomez",
          birthday: "1984",
          avatar: "https://i.pravatar.cc/150?img=49",
          gender: "M",
        },
        rels: {
          father: "valley_gomez",
          mother: "brenda_gomez",
        },
      },
      {
        id: "gail_gomez",
        data: {
          "first name": "Gail",
          "last name": "Gomez",
          birthday: "1985",
          avatar: "https://i.pravatar.cc/150?img=19",
          gender: "F",
        },
        rels: {
          father: "nobert_gomez",
          mother: "sharon_gomez",
        },
      },
      {
        id: "steffie_gomez",
        data: {
          "first name": "Steffie",
          "last name": "Gomez",
          birthday: "1987",
          avatar: "https://i.pravatar.cc/150?img=18",
          gender: "F",
        },
        rels: {
          father: "nobert_gomez",
          mother: "sharon_gomez",
        },
      },
      {
        id: "travis_hale",
        data: {
          "first name": "Travis",
          "last name": "Hale",
          birthday: "1977",
          avatar: "https://i.pravatar.cc/150?img=46",
          gender: "M",
        },
        rels: {
          father: "tyronne_hale",
          mother: "janet_hale",
        },
      },
      {
        id: "christine_culleden",
        data: {
          "first name": "Christine",
          "last name": "Culleden",
          birthday: "1975",
          avatar: "https://i.pravatar.cc/150?img=37",
          gender: "F",
        },
        rels: {
          father: "dino_culleden",
          mother: "clinton_culleden",
        },
      },
      {
        id: "christopher_culleden",
        data: {
          "first name": "Christopher",
          "last name": "Culleden",
          birthday: "1977",
          avatar: "https://i.pravatar.cc/150?img=42",
          gender: "M",
        },
        rels: {
          father: "dino_culleden",
          mother: "clinton_culleden",
        },
      },
      {
        id: "golu_culleden",
        data: {
          "first name": "Golu",
          "last name": "Culleden",
          birthday: "1979",
          avatar: "https://i.pravatar.cc/150?img=39",
          gender: "M",
        },
        rels: {
          father: "dino_culleden",
          mother: "clinton_culleden",
        },
      },
      {
        id: "virginia_culleden",
        data: {
          "first name": "Virginia",
          "last name": "Culleden",
          birthday: "1981",
          avatar: "https://i.pravatar.cc/150?img=34",
          gender: "F",
        },
        rels: {
          father: "dino_culleden",
          mother: "clinton_culleden",
        },
      },
      {
        id: "darren_vanmanen",
        data: {
          "first name": "Darren",
          "last name": "Vanmanen",
          birthday: "1978",
          avatar: "https://i.pravatar.cc/150?img=16",
          gender: "M",
        },
        rels: {
          father: "leon_vanmanen",
          mother: "rosland_vanmanen",
        },
      },
      {
        id: "lynette_vanmanen",
        data: {
          "first name": "Lynette",
          "last name": "Vanmanen",
          birthday: "1980",
          avatar: "https://i.pravatar.cc/150?img=9",
          gender: "F",
        },
        rels: {
          father: "leon_vanmanen",
          mother: "rosland_vanmanen",
        },
      },{
        id: "janice_vanmanen",
        data: {
          "first name": "Janice",
          "last name": "Vanmanen",
          birthday: "1979",
          avatar: "https://i.pravatar.cc/150?img=10",
          gender: "F",
        },
        rels: {
          father: "jimmy_vanmanen",
          mother: "patricia_vanmanen",
        },
      },
      {
        id: "nattu_vanmanen",
        data: {
          "first name": "Nattu",
          "last name": "Vanmanen",
          birthday: "1981",
          avatar: "https://i.pravatar.cc/150?img=8",
          gender: "F",
        },
        rels: {
          father: "jimmy_vanmanen",
          mother: "patricia_vanmanen",
        },
      },

      // Generation 1 (Children)
      {
        id: "dwain_isaac",
        data: {
          "first name": "Dwain",
          "last name": "Isaac",
          birthday: "2000",
          avatar: "https://i.pravatar.cc/150?img=71",
          gender: "M",
        },
        rels: {
          father: "neil_isaac",
          mother: "yolen_isaac",
        },
      },
      {
        id: "aarya_isaac",
        data: {
          "first name": "Aarya",
          "last name": "Isaac",
          birthday: "2002",
          avatar: "https://i.pravatar.cc/150?img=5",
          gender: "F",
        },
        rels: {
          father: "keith_isaac",
          mother: "natalie_isaac",
        },
      },
      {
        id: "frank_isaac",
        data: {
          "first name": "Frank",
          "last name": "Isaac",
          birthday: "2004",
          avatar: "https://i.pravatar.cc/150?img=72",
          gender: "M",
        },
        rels: {
          father: "keith_isaac",
          mother: "natalie_isaac",
        },
      },
]