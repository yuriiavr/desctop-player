# myPlayer

myPlayer — це десктопний музичний плеєр з можливістю завантаження музики з YouTube. Цей додаток надає користувачеві зручний інтерфейс для керування плейлистами, відтворення музики та завантаження треків прямо з YouTube.

## Функціонал
- **Відтворення музики:** Плеєр підтримує відтворення музичних файлів, доданих до плейлистів.
- **Завантаження з YouTube:** Завантажуйте музику з YouTube, вставляючи посилання на відео.
- **Керування плейлистами:** Створюйте, перейменовуйте та видаляйте плейлисти для зручної організації ваших музичних файлів.

## Інсталяція та Запуск
1. **Завантаження:** Скачайте останню версію програми [myPlayer.zip](https://github.com/yuriiavr/desctop-player/releases/tag/myPlayer).
2. **Розпакування:** Розпакуйте архів на вашому комп'ютері.
3. **Запуск:** Запустіть файл `myPlayer.exe`, щоб користуватися програмою.

## Вимоги до системи
- **Операційна система:** Windows 7 або новіша.
- **Node.js:** Для запуску в режимі розробника потрібен встановлений Node.js.

## Команди для розробників
- **Запуск у режимі розробника:**
  ```
  npm run dev
  ```
- **Збірка дистрибутиву:**
  ```
  npm run dist
  ```

## Використані Технології
- **Electron**: Для створення кросплатформенного десктопного додатку.
- **Puppeteer**: Для автоматизації завантаження музики з YouTube.
- **Electron Builder**: Для пакування та підготовки дистрибутиву додатку.

## Поширені проблеми
- **Іконка не встановлюється:** Переконайтеся, що файл `icon.ico` має правильний формат і декілька розмірів зображення (16x16, 32x32, 48x48, 256x256).
- **Проблеми з правами доступу:** Спробуйте запускати команду створення дистрибутиву з правами адміністратора.

## Ліцензія
Цей проект ліцензований під [MIT License](LICENSE).

## Зворотній зв'язок
Якщо у вас є пропозиції або питання, будь ласка, відкрийте issue на [GitHub](https://github.com/username/myPlayer/issues).

