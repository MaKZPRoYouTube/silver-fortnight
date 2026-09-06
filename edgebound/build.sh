#!/bin/bash
echo "🚀 Сборка EDGEBOUND для Яндекс Игр..."

# 1. Компиляция TypeScript
npx tsc -p tsconfig.json

# 2. Создание папки релиза
rm -rf release
mkdir -p release

# 3. Копирование файлов
cp dist/game.js release/game.js
cp styles.css release/styles.css

# 4. Создание релизного index.html со ссылкой на скомпилированный game.js
sed 's|src="/src/game.ts"|src="./game.js"|g' index.html > release/index.html

# 5. Упаковка в zip (корень архива должен содержать index.html)
cd release
zip -r ../edgebound-yandex.zip index.html styles.css game.js
cd ..

echo "✅ Готово! Создан архив: edgebound-yandex.zip (готов к загрузке в консоль Яндекса)"
