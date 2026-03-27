Rocket.Chat Пользовательский импортер эмодзи
=================================

Этот репозиторий содержит Node.js скрипт для импорта пользовательских эмодзи из YAML-файла в  Rocket.Chat. Скрипт использует Rocket.Chat API, упрощающий массовый импорт пользовательских эмодзи без прямого доступа к базе данных. Он также поддерживает использование файла `.env` файл с Rocket.Chat сервер URL, логином и паролем администратора.

Инстуркция 
--------

*  git clone https://github.com/m-koloy/emoji.git - установка скрипта  
*  cd emoji - переход в папку со скриптом
*  npm install - установка зависимости
*  Добавить значения в папку .env
ROCKETCHAT_SERVER_URL=https://your-rocketchat-server-url 
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password
*  node import-custom-emojis.js - запуск скрипта
*  https://raw.githubusercontent.com/m-koloy/emoji/refs/heads/main/School21.yaml - указать URL файла yaml с ссылками на эмодзи и названиями 

Особенности
--------

*   Импорт пользовательских эмодзи из удаленного YAML-файла
    
    Скрипт позволяет легко импортировать пользовательские эмодзи из удаленного файла YAML, указав URL-адрес файла. Файл YAML должен содержать названия эмодзи и источники изображений в хорошо структурированном формате.
    
*   Использует Rocket.Chat-API для простой и безопасной интеграции
    
    Этот скрипт взаимодействует с вашим Rocket.Chat - сервер использует официальный API, что обеспечивает безопасный и простой процесс интеграции. Для аутентификации с помощью API вам потребуется ввести имя пользователя и пароль администратора.
    
*   Использует Rocket.Chat-API для простой и безопасной интеграции
    
    Скрипт использует простой интерфейс командной строки для сбора необходимой информации, такой как URL-адрес файла YAML, Rocket.Chat URL-адрес и учетные данные администратора, что упрощает его запуск и настройку.
    
*   Автоматическая загрузка пользовательских изображений с эмодзи
    
    Скрипт загружает пользовательские изображения эмодзи с URL-адресов, указанных в файле YAML, и загружает их на ваш Rocket.Чат-сервер. Этот автоматизированный процесс упрощает массовый импорт пользовательских эмодзи.
    
*   Поддержка массового импорта
    
    Этот скрипт предназначен для одновременной обработки нескольких пользовательских смайликов, что позволяет вам импортировать большое количество смайликов за один запуск, экономя ваше время и усилия.
    
*   Использование файла `.env` для хранения URL сервера и учетных данных администратора
    
    Вы можете создать файл `.env` в папке project для вашего Rocket.chat - сервер чата, имя и пароль администратора. Это поможет сохранить ваши учетные данные в безопасности и упростит запуск скрипта, так как вам не нужно будет каждый раз вводить эти значения вручную.
    
*   Пропуск существующих эмодзи
    
    Скрипт был обновлен, чтобы проверять наличие пользовательских эмодзи в Rocket.Chat-сервер перед загрузкой новых эмодзи. Если эмодзи из файла YAML уже присутствует на сервере, скрипт пропустит загрузку этого эмодзи и информирует вас о том, что оно было пропущено. Это помогает предотвратить загрузку повторяющихся эмодзи, если вы запускаете скрипт несколько раз, используя один и тот же YAML-файл.

Требования
------------

*   Node.js
*   npm (обычно идет с Node.js)
*   Rocket.Chat чата с правами администратора

Зависимости
------------

Скрипт Node.js использует следующее значения:

*   `request`: Для выполнения HTTP-запросов и взаимодействия с Rocket.Chat API
*   `js-yaml`: Для поиска YAML files
*   `readline`: Для чтения пользовательских данных, вводимых из командной строки
*   `dotenv`: Для загрузки переменные из файла `.env`

Installation
------------

1.  Клонировать этот репозиторий:
    
    ```bash
    git clone https://github.com/m-koloy/emoji.git
    cd rocketchat-emoji-bulk-upload
    ```
    
2.  Установите необходимые зависимости:
    
    `npm install`

Usage
-----

1.  При необходимости создайте файл `.env` в каталоге проекта со следующим содержимым:
    

    ```ini
    ROCKETCHAT_SERVER_URL=https://your-rocketchat-server-url 
    ADMIN_USERNAME=your-admin-username
    ADMIN_PASSWORD=your-admin-password
    ```
    
    Замените значения на ваши настоящие Rocket.Chat URL-адрес , имя пользователя и пароль администратора. Скрипт будет использовать эти значения, если они заданы в файле `.env`, в противном случае он предложит пользователю ввести их.

   **Примечание **: В этом репозитории есть файл ".env.example", который вы можете использовать в качестве шаблона. Просто переименуйте его в `.env` и введите свою информацию.

    
2.  Запускаем скрипт:
    
    `node import-custom-emojis.js`
    
3.  Если вы не указали необходимую информацию в файле `.env`, следуйте инструкциям и укажите требуемую информацию:
    
    *   URL for the YAML file containing the custom emojis
    *   Rocket.Chat server URL
    *   Rocket.Chat admin username
    *   Rocket.Chat admin password

Затем скрипт получит файл YAML, проанализирует его и начнет загрузку пользовательских эмодзи в ваш Rocket.Chat. Процесс может занять некоторое время, в зависимости от количества пользовательских эмодзи и размера их файлов. После того, как все эмодзи будут загружены, скрипт выдаст сообщение об успешном завершении.

Emoji Packs
------------
*   [animals](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/animals.yaml)
*   [clippy](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/clippy.yaml)
*   [fika](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/fika.yaml)
*   [frontend](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/frontend.yaml)
*   [harrypotter](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/harrypotterhouses.yaml)
*   [mario](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/mario-8bit.yaml)
*   [occupy](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/occupy.yaml)
*   [officespace](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/officespace.yaml)
*   [omnom](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/omnom.yaml)
*   [futurama](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/futurama.yaml)
*   [food](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/food.yaml)
*   [skype](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/skype.yaml)
*   [starwars](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/starwars.yaml)
*   [startups](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/startups.yaml)
*   [businessfish](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/businessfish.yaml)
*   [hipchat](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/hipchat.yaml)
*   [twitch](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/twitch.yaml)
*   [parrotparty](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/parrotparty.yaml) ([Parrot](http://cultofthepartyparrot.com/) [Paint](http://cultofthepartyparrot.com/paint/))
*   [Finland](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/finland.yaml)
*   [pokemongo: items](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/pokemongo.yaml)
*   [Pokémon Go: Pokémon](https://raw.githubusercontent.com/Templarian/slack-emoji-pokemon/master/pokemon.yaml) ([Prefixed `pokemon-*`](https://raw.githubusercontent.com/Templarian/slack-emoji-pokemon/master/pokemon-prefix.yaml))
*   [politipack](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/politipack.yaml)
*   [nekoatsume](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/nekoatsume.yaml)
*   [octicons](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/octicons.yaml)
*   [pokemon](https://raw.githubusercontent.com/jaylynch/pokemoji/master/pokemon-by-name.yaml)
*   [devicon](https://raw.githubusercontent.com/izumin5210/emojipack-for-devicon/master/png/devicon.yaml) ([Devicon](http://devicon.fr/))
*   [hamsterdance](https://raw.githubusercontent.com/snipe/hamsterdance-emojipack/master/hamsterdance.yaml) ([snipe/emojipacks](https://github.com/snipe/hamsterdance-emojipack))
*   [avengers](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/avengers.yaml)
*   [Shiba Stickers](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/shiba.yaml) (from Messenger)
*   [gamedevmoji](https://raw.githubusercontent.com/niksudan/gamedevmoji/master/gamedevicons.yaml)
*   [AWS simple icons](https://raw.githubusercontent.com/Surgo/aws_emojipacks/master/noprefix-emojipacks.yml)

Emoji packs from [slackmojis.com](http://www.slackmojis.com)
------------

*   [Uncategorized](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-uncategorized.yaml)
*   [Facebook Reaction](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-facebook-reaction.yaml)
*   [Logo](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-logo.yaml)
*   [Meme](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-meme.yaml)
*   [MLB](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-mlb.yaml)
*   [NBA](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-nba.yaml)
*   [NFL](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-nfl.yaml)
*   [NHL](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-nhl.yaml)
*   [NYC Subway](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-nyc-subway.yaml)
*   [Party Parrot](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-party-parrot.yaml)
*   [Pokemon](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-pokemon.yaml)
*   [Retro Game](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-retro-game.yaml)
*   [Scrabble Letters](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-scrabble-letters.yaml)
*   [Skype](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-skype.yaml)
*   [Star Wars](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-star-wars.yaml)
*   [Turntable.fm](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-turntable.fm.yaml)
*   [Yoyo](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-yoyo.yaml)

Вклад
------------

Если вы хотите внести свой вклад в этот проект, не стесняйтесь отправлять запрос на доработку или открывать проблему. Мы всегда рады вашим отзывам и предложениям!

Лицензия
-------

Этот проект лицензирован по лицензии MIT. Подробности смотрите в файле `ЛИЦЕНЗИЯ`

Дисклеймер
----------
Данный скрипт Вы используйте  на свой страх и риск. Всегда делайте резервную копию своих данных, прежде чем вносить какие-либо изменения в свой Rocket.Chat сервер.


