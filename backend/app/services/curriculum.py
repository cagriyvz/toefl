"""
Lexi — MEB Türkiye Yüzyılı Maarif Modeli Müfredatı
Kaynak: tymm.meb.gov.tr
"""

CURRICULUM = {
    "9": {
        "level": "B1.1",
        "themes": [
            {"id": 1, "title": "THEME 1: SCHOOL LIFE",                                    "topic_key": "school_life"},
            {"id": 2, "title": "THEME 2: CLASSROOM LIFE",                                  "topic_key": "classroom_life"},
            {"id": 3, "title": "THEME 3: PERSONAL LIFE: PHYSICAL APPEARANCE & PERSONALITY","topic_key": "personal_life"},
            {"id": 4, "title": "THEME 4: FAMILY LIFE",                                     "topic_key": "family_life"},
            {"id": 5, "title": "THEME 5: LIFE IN THE HOUSE & NEIGHBOURHOOD",               "topic_key": "neighbourhood"},
            {"id": 6, "title": "THEME 6: LIFE IN THE CITY & COUNTRY",                      "topic_key": "city_country"},
            {"id": 7, "title": "THEME 7: LIFE IN THE WORLD & NATURE",                      "topic_key": "world_nature"},
            {"id": 8, "title": "THEME 8: LIFE IN THE UNIVERSE & FUTURE",                   "topic_key": "universe_future"},
        ],
        "grammar": [
            "Simple Present Tense",
            "Simple Past Tense",
            "Present Continuous Tense",
            "Past Continuous Tense",
            "Future with 'going to'",
            "Future with 'will'",
            "Comparison of Adjectives",
            "Modal Verbs: can, could, must, should",
            "Articles: a, an, the",
            "Prepositions of Time and Place",
            "Countable and Uncountable Nouns",
            "There is / There are",
            "Subject and Object Pronouns",
            "Possessive Adjectives and Pronouns",
            "Question Words (Wh- Questions)",
        ],
    },
    "10": {
        "level": "B1.2",
        "themes": [
            {"id": 1, "title": "THEME 1: SCHOOL LIFE & EDUCATION",                         "topic_key": "school_education"},
            {"id": 2, "title": "THEME 2: CLASSROOM LIFE & LEARNING",                       "topic_key": "classroom_learning"},
            {"id": 3, "title": "THEME 3: PERSONAL LIFE & WELL-BEING",                      "topic_key": "personal_wellbeing"},
            {"id": 4, "title": "THEME 4: FAMILY LIFE & HOME",                              "topic_key": "family_home"},
            {"id": 5, "title": "THEME 5: LIFE IN THE NEIGHBOURHOOD, CITY & SOCIAL LIFE",   "topic_key": "neighbourhood_city"},
            {"id": 6, "title": "THEME 6: LIFE IN THE WORLD & CULTURE",                     "topic_key": "world_culture"},
            {"id": 7, "title": "THEME 7: LIFE IN NATURE & GLOBAL PROBLEMS",                "topic_key": "nature_global"},
            {"id": 8, "title": "THEME 8: LIFE IN THE UNIVERSE & THE FUTURE",               "topic_key": "universe_future"},
        ],
        "grammar": [
            "Present Perfect Tense",
            "Present Perfect Continuous",
            "Past Perfect Tense",
            "Passive Voice (Present & Past)",
            "Reported Speech (Statements)",
            "Reported Speech (Questions & Commands)",
            "Conditional Type 1",
            "Conditional Type 2",
            "Relative Clauses (who, which, that)",
            "Gerunds and Infinitives",
            "Modal Verbs: might, may, would, shall",
            "Quantifiers: some, any, much, many, few, little",
            "Adjective Order",
            "Adverbs of Frequency and Manner",
            "Conjunctions: although, however, therefore, moreover",
        ],
    },
    "11": {
        "level": "B1.3",
        "themes": [
            {"id": 1, "title": "THEME 1: SCHOOL LIFE & EDUCATION",                         "topic_key": "school_education"},
            {"id": 2, "title": "THEME 2: CLASSROOM LIFE & LEARNING",                       "topic_key": "classroom_learning"},
            {"id": 3, "title": "THEME 3: PERSONAL LIFE & WELL-BEING",                      "topic_key": "personal_wellbeing"},
            {"id": 4, "title": "THEME 4: FAMILY LIFE & HOME",                              "topic_key": "family_home"},
            {"id": 5, "title": "THEME 5: LIFE IN THE NEIGHBOURHOOD, CITY & SOCIAL LIFE",   "topic_key": "neighbourhood_city"},
            {"id": 6, "title": "THEME 6: LIFE IN THE WORLD & CULTURE",                     "topic_key": "world_culture"},
            {"id": 7, "title": "THEME 7: LIFE IN NATURE & GLOBAL PROBLEMS",                "topic_key": "nature_global"},
            {"id": 8, "title": "THEME 8: LIFE IN THE UNIVERSE & FUTURE",                   "topic_key": "universe_future"},
        ],
        "grammar": [
            "Passive Voice (All Tenses)",
            "Conditional Type 3",
            "Mixed Conditionals",
            "Wish and If Only",
            "Reported Speech (Advanced)",
            "Relative Clauses (whose, where, when)",
            "Participle Clauses",
            "Causative Have/Get",
            "Modal Perfect (must have, should have, could have)",
            "Inversion for Emphasis",
            "Cleft Sentences",
            "Connectors of Contrast, Cause, Result",
            "Noun Clauses",
            "Defining vs Non-defining Relative Clauses",
            "Articles — Advanced Use",
        ],
    },
    "12": {
        "level": "B1.4",
        "themes": [
            {"id": 1, "title": "THEME 1: SCHOOL LIFE, CLASSROOM LIFE & EDUCATION",         "topic_key": "school_classroom"},
            {"id": 2, "title": "THEME 2: PERSONAL LIFE & WELL-BEING",                      "topic_key": "personal_wellbeing"},
            {"id": 3, "title": "THEME 3: FAMILY LIFE & HOME",                              "topic_key": "family_home"},
            {"id": 4, "title": "THEME 4: CITY & SOCIAL LIFE",                              "topic_key": "city_social"},
            {"id": 5, "title": "THEME 5: LIFE IN THE CULTURAL AND NATURAL WORLD",          "topic_key": "cultural_natural"},
            {"id": 6, "title": "THEME 6: LIFE IN THE UNIVERSE & FUTURE",                   "topic_key": "universe_future"},
        ],
        "grammar": [
            "Advanced Passive Constructions",
            "Advanced Conditionals and Wishes",
            "Emphasis: Inversion and Cleft Sentences",
            "Advanced Modal Verbs",
            "Discourse Markers and Cohesion",
            "Ellipsis and Substitution",
            "Nominalization",
            "Advanced Reported Speech",
            "Subjunctive Mood",
            "Complex Sentence Structures",
            "Hedging Language",
            "Collocation and Phrasal Verbs",
            "Register: Formal vs Informal Language",
            "Academic Vocabulary in Context",
            "Error Correction — Mixed Grammar",
        ],
    },
}

def get_curriculum(grade: str) -> dict:
    return CURRICULUM.get(str(grade), CURRICULUM["10"])

def get_grammar_topics(grade: str) -> list:
    return get_curriculum(grade)["grammar"]

def get_themes(grade: str) -> list:
    return get_curriculum(grade)["themes"]

def get_level(grade: str) -> str:
    return get_curriculum(grade)["level"]
