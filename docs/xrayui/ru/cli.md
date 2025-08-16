# Командная строка (CLI)

`XRAYUI` располагается по пути `/jffs/scripts/xrayui` и запускается по `SSH` на вашем роутере. Допустима краткая запись:`xrayui <команда>` вместо полного `/jffs/scripts/xrayui <команда>`.

## Quick reference

[[toc]]

## Управление сервисом

### `xrayui start`

Запускает Xray и все зависимости интерфейса; при необходимости настраивает маршрутизацию и политики.

### `xrayui stop`

Корректно останавливает Xray и удаляет правила/маршруты, добавленные XRAYUI.

### `xrayui restart`

Останавливает и заново запускает Xray; формирует маршруты «с нуля».

### `xrayui version`

Печатает установленную версию XRAYUI и версию `Xray-core`.

```bash
xrayui version
# XRAYUI: 0.56.1, XRAY-CORE: 25.6.8
```

## Обновления

### `xrayui update`

Обновляет XRAYUI до последнего стабильного релиза.

### `xrayui update <version>`

Устанавливает указанную версию XRAYUI.

### `xrayui update xray <version|latest>`

Устанавливает указанную версию `Xray-core`.
::: tip
Загрузки выполняются с GitHub. Если GitHub блокируется/ограничивается, включите Использовать прокси GitHub в [Общих настройках](general-options#использовать-прокси-github).
:::

## Состояние и диагностика

### `xrayui fixme`

Быстрая самодиагностика с попыткой безопасного авто-исправления.

### `xrayui diagnostics`

Полный диагностический набор: сведения об окружении, правила iptables/маршрутизации и проверки XRAYUI.

### `xrayui diagnostics xrayui`

Диагностика, сфокусированная на файлах XRAYUI, статусе и сервисных триггерах.

### `xrayui diagnostics env`

Сбор системной и окруженческой информации, релевантной работе Xray.

### `xrayui diagnostics iptables`

Проверка правил маршрутизации/брандмауэра, которыми управляет XRAYUI.

::: tip
Вывод команд диагностики пригоден для отправки в [группу телеграм](https://t.me/asusxray) при разборе проблем.
:::

## Автоматизация (cron)

### `xrayui cron addjobs`

Создаёт рекомендуемые задания cron: ротация логов, проверка обновлений, ночное обновление геоданных.

### `xrayui cron deletejobs`

Удаляет все задания cron, ранее созданные `addjobs`.

## Установка, резервное копирование и обслуживание UI

### `xrayui install` / `xrayui uninstall`

Установить или полностью удалить плагин и его сервис.

### `xrayui backup`

Создать резервную копию конфигурации и данных, которую можно скопировать с роутера. Резервные копии сохраняются в каталоге `/opt/share/xrayui/backup`.

На данный момент XRAYUI сохраняет следующие сущности:

```bash
/jffs/xrayui_custom # user xrayui trigger scripts
/opt/etc/xray # all JSON files and certificates
/opt/etc/xrayui.conf # config file containing xrayui general settings
/opt/share/xrayui/data # user defined geodat decompiled (sources) files
```

> [!Caution]
> На данный момент автоматического восстановления из бэкапа нет — восстановление выполняется вручную.

### `xrayui remount_ui`

Повторно подключить вкладку X-RAY к веб-интерфейсу (полезно после обновлений прошивки/веб-UI).

## Дополнительно: сервисные события

Эти команды обычно вызываются хуками или из веб-интерфейса, но их безопасно запускать из SSH при диагностике.

### `xrayui service_event startup`

Инициализация после загрузки.

### `xrayui service_event configuration logs fetch`

Экспорт логов сервиса в просмотрщик логов веб-интерфейса.

### `xrayui service_event firewall configure`

Применить правила `iptables` без перезапуска Xray.

### `xrayui service_event firewall cleanup`

Удалить правила `iptables` без перезапуска Xray.
