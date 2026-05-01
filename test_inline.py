import sys
sys.path.insert(0, '.')
from bracket_ingredients import transform_ingredient_line

tests = [
    "          - 500 g kysanego zeli",
    "          - 1 nakrajena cibule (muzet vynechat, ale pro chut polevky je lepsi rozmixovat ji na kasi, tak o ni nebudet vedet)",
    "          - sul, pepr 3 bobkove listy",
    "          - 2 klobasy nakrajene na pulky kolecek (pro naseho Honzu bez kminu)",
    "          - kmin cely (pro naseho Honzu NE! )",
    "          - 1 lzice hladke mouky nebo bramborovy ci kukuriczny skrob",
    "          - 1 kelimek smetany ke slehani",
    "          - 2 vetsi brambory nakrajene na kosticky",
    "          - 1 lzice cukru",
    "          - 1 kostka masoxu",
]
for t in tests:
    print(repr(transform_ingredient_line(t)))
