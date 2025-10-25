# Использование v2dat для инспекции баз данных Geosite и GeoIP

## Что такое v2dat?

v2dat - это CLI инструмент, включенный в **XRAYUI**, который позволяет очень быстро просматривать и извлекать содержимое из файлов `geosite.dat` и `geoip.dat`.

v2dat - это незаменимый инструмент для понимания и отладки конфигурации маршрутизации xrayui. Используйте его каждый раз, когда вам нужно проверить, какой трафик будет соответствовать вашим правилам.

Это бесценно для:

- Понимания того, какие домены/IP включены в конкретные категории
- Отладки правил маршрутизации
- Проверки пользовательских компиляций geosite
- Поиска подходящей категории для ваших нужд

## Расположение установки

Когда **XRAYUI** установлен, v2dat находится по адресу:

```bash
/opt/share/xrayui/v2dat
```

Файлы геоданных расположены в:

```bash
/opt/sbin/geosite.dat  # База данных geosite сообщества
/opt/sbin/geoip.dat    # База данных geoip сообщества
/opt/sbin/xrayui       # Пользовательский скомпилированный geosite (если создан)
```

## Примеры общего использования

### Список всех доступных тегов

#### Теги Geosite

```bash
/opt/share/xrayui/v2dat unpack geosite -t /opt/sbin/geosite.dat
```

Это показывает все доступные категории geosite, такие как `google`, `netflix`, `telegram` и т.д.

#### Теги GeoIP

```bash
/opt/share/xrayui/v2dat unpack geoip -t /opt/sbin/geoip.dat
```

Это показывает все коды стран, такие как `cn`, `us`, `private` и т.д.

### Инспекция конкретных категорий

#### Просмотр содержимого категории Geosite

```bash
# Вывод в консоль (полезно для быстрых проверок)
/opt/share/xrayui/v2dat unpack geosite -p -f netflix /opt/sbin/geosite.dat

# Сохранение в файл (полезно для детального анализа)
/opt/share/xrayui/v2dat unpack geosite -o /tmp -f netflix /opt/sbin/geosite.dat
cat /tmp/geosite_netflix.txt
```

#### Просмотр содержимого страны GeoIP

```bash
# Вывод диапазонов IP Китая
/opt/share/xrayui/v2dat unpack geoip -p -f cn /opt/sbin/geoip.dat

# Сохранение диапазонов IP США в файл
/opt/share/xrayui/v2dat unpack geoip -o /tmp -f us /opt/sbin/geoip.dat
```

### Расширенное использование

#### Извлечение нескольких категорий

```bash
# Извлечение конкретных категорий
for tag in google facebook youtube netflix; do
  /opt/share/xrayui/v2dat unpack geosite -o /tmp -f $tag /opt/sbin/geosite.dat
done

# Теперь у вас есть:
# /tmp/geosite_google.txt
# /tmp/geosite_facebook.txt
# /tmp/geosite_youtube.txt
# /tmp/geosite_netflix.txt
```

#### Извлечь всё

```bash
# Извлечь ВСЕ категории geosite (внимание: создаёт много файлов)
/opt/share/xrayui/v2dat unpack geosite -o /tmp/all_geosites /opt/sbin/geosite.dat

# Извлечь ВСЕ категории geoip
/opt/share/xrayui/v2dat unpack geoip -o /tmp/all_geoips /opt/sbin/geoip.dat
```

#### Поиск конкретного домена

```bash
# Извлечь всё и искать
/opt/share/xrayui/v2dat unpack geosite -o /tmp/geosites /opt/sbin/geosite.dat
grep -r "example.com" /tmp/geosites/

# Или проверить конкретные категории
for tag in cn google facebook; do
  echo "Проверка $tag..."
  /opt/share/xrayui/v2dat unpack geosite -p -f $tag /opt/sbin/geosite.dat | grep -i "example"
done
```

## Понимание вывода

### Паттерны доменов Geosite

Когда вы проверяете категорию geosite, вы увидите различные типы паттернов:

```text
# netflix (247 доменов)
domain:netflix.com        # Соответствует netflix.com и ВСЕМ поддоменам
full:netflix.ca           # Соответствует ТОЛЬКО netflix.ca точно
keyword:nflx              # Соответствует любому домену, содержащему "nflx"
regexp:^netflix\\.com$    # Соответствие регулярному выражению
```

### Нотация CIDR для GeoIP

Вывод GeoIP показывает диапазоны IP в нотации CIDR:

```text
# cn (8343 cidr)
1.0.1.0/24
1.0.8.0/21
1.0.32.0/19
```

## Практические сценарии отладки

### Сценарий 1: Почему моё правило не работает?

Проверьте, действительно ли домен находится в категории:

```bash
# Проверить, находится ли youtube.com в категории youtube
/opt/share/xrayui/v2dat unpack geosite -p -f youtube /opt/sbin/geosite.dat | grep "^youtube.com$"
```

### Сценарий 2: Какая категория содержит мой домен?

Поиск по всем категориям:

```bash
# Извлечь все категории в `/opt/share/xrayui/extract`
mkdir -p /opt/share/xrayui/extract
/opt/share/xrayui/v2dat unpack geosite -o /opt/share/xrayui/extract /opt/sbin/geosite.dat

```

### Сценарий 3: Проверка пользовательской компиляции geosite

После создания пользовательских файлов geosite в xrayui:

```bash
# Проверить, существует ли ваша пользовательская категория
/opt/share/xrayui/v2dat unpack geosite -t /opt/sbin/xrayui | grep mylist

# Проверить содержимое
/opt/share/xrayui/v2dat unpack geosite -p -f mylist /opt/sbin/xrayui
```

### Сценарий 4: Выгрузка категорий

```bash
# Извлечь две категории в `/opt/share/xrayui`
/opt/share/xrayui/v2dat unpack geosite -o /opt/share/xrayui -f google -f youtube /opt/sbin/geosite.dat

# Извлечь две категории и вывести содержимое в консоль
/opt/share/xrayui/v2dat unpack geosite -p -f google -f youtube /opt/sbin/geosite.dat

# Извлечь две категории и сохранить содержимое в файл `/opt/share/xrayui/domains.txt`
/opt/share/xrayui/v2dat unpack geosite -p -f google -f youtube /opt/sbin/geosite.dat >/opt/share/xrayui/domains.txt
```

## Краткий справочник

### Структура команды

```bash
v2dat unpack [geosite|geoip] [options] <dat_file>
```

### Общие опции

| Опция      | Описание                         | Пример                                            |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `-t`       | Список всех тегов                | `v2dat unpack geosite -t file.dat`                |
| `-p`       | Вывод в stdout                   | `v2dat unpack geosite -p -f google file.dat`      |
| `-o <dir>` | Директория вывода                | `v2dat unpack geosite -o /tmp -f google file.dat` |
| `-f <tag>` | Фильтр по тегу (можно несколько) | `v2dat unpack geosite -f netflix file.dat`        |

### Справочник расположения файлов

| Файл                     | Путь                      | Описание                        |
| ------------------------ | ------------------------- | ------------------------------- |
| Geosite сообщества       | `/opt/sbin/geosite.dat`   | Официальные категории доменов   |
| GeoIP сообщества         | `/opt/sbin/geoip.dat`     | IP диапазоны по странам         |
| Пользовательский Geosite | `/opt/sbin/xrayui`        | Ваши скомпилированные категории |
| Бинарный файл v2dat      | `/opt/share/xrayui/v2dat` | Инструмент инспекции            |

## Советы и хитрости

1. **Использование less для больших выводов**:

   ```bash
   /opt/share/xrayui/v2dat unpack geosite -p -f cn /opt/sbin/geosite.dat | less
   ```

2. **Подсчёт доменов в категории**:

   ```bash
   /opt/share/xrayui/v2dat unpack geosite -p -f google /opt/sbin/geosite.dat | wc -l
   ```

3. **Поиск категорий с конкретными паттернами доменов**:

   ```bash
   for tag in $(/opt/share/xrayui/v2dat unpack geosite -t /opt/sbin/geosite.dat); do
     if /opt/share/xrayui/v2dat unpack geosite -p -f $tag /opt/sbin/geosite.dat | grep -q "cdn"; then
       echo "$tag содержит CDN домены"
     fi
   done
   ```

4. **Создание справочного файла категорий**:

   ```bash
   for tag in $(/opt/share/xrayui/v2dat unpack geosite -t /opt/sbin/geosite.dat | head -20); do
     count=$(/opt/share/xrayui/v2dat unpack geosite -p -f $tag /opt/sbin/geosite.dat | wc -l)
     echo "$tag: $count доменов"
   done > /tmp/geosite_summary.txt
   ```
