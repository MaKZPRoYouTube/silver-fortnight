declare global {
    interface Window {
        YaGames?: {
            init: () => Promise<any>;
        };
    }
}

export class YandexBridge {
    private ysdk: any = null;
    private player: any = null;
    public isInitialized: boolean = false;
    private lastAdTime: number = 0;

    public async init(): Promise<void> {
        // Проверяем, запущена ли игра внутри iframe на серверах Яндекса
        const isInsideIframe = window.parent !== window;

        if (window.YaGames && isInsideIframe) {
            try {
                this.ysdk = await window.YaGames.init();
                this.isInitialized = true;

                // Сообщаем Яндексу, что игра загрузилась
                this.ysdk.features.LoadingAPI?.ready();

                // Инициализация игрока
                try {
                    this.player = await this.ysdk.getPlayer({ scopes: false });
                } catch (e) {
                    console.log('ℹ️ Игрок не авторизован (гостевой режим)');
                }

                console.log('✅ Yandex Games SDK успешно подключен!');
            } catch (error) {
                console.warn('⚠️ Ошибка подключения к Яндекс SDK:', error);
            }
        } else {
            console.log('🛠️ Локальный режим: эмуляция Яндекс SDK (без ошибок)');
            this.isInitialized = true;
        }
    }

    // Полноэкранная реклама (Interstitial)
    public showFullscreenAd(onOpen?: () => void, onClose?: () => void): void {
        const now = Date.now();
        if (now - this.lastAdTime < 60000) {
            onClose?.();
            return;
        }

        if (this.ysdk) {
            this.ysdk.adv.showFullscreenAdv({
                callbacks: {
                    onOpen: () => {
                        this.lastAdTime = Date.now();
                        onOpen?.();
                    },
                    onClose: () => onClose?.(),
                    onError: () => onClose?.()
                }
            });
        } else {
            console.log('📺 [Тест] Показ межстраничной рекламы');
            onClose?.();
        }
    }

    // Реклама за вознаграждение (Спасение стрика)
    public showRewardedAd(onRewarded: () => void, onClose?: () => void): void {
        if (this.ysdk) {
            this.ysdk.adv.showRewardedVideo({
                callbacks: {
                    onRewarded: () => onRewarded(),
                    onClose: () => onClose?.(),
                    onError: () => onClose?.()
                }
            });
        } else {
            console.log('🎁 [Тест] Реклама за вознаграждение: стрик спасён!');
            onRewarded();
            onClose?.();
        }
    }

    // Отправка очков в таблицу лидеров (исправлен deprecated вызов)
    public async submitScore(leaderboardName: string, score: number): Promise<void> {
        if (this.ysdk) {
            try {
                if (this.ysdk.leaderboards) {
                    await this.ysdk.leaderboards.setLeaderboardScore(leaderboardName, score);
                } else if (this.ysdk.getLeaderboards) {
                    const lb = await this.ysdk.getLeaderboards();
                    await lb.setLeaderboardScore(leaderboardName, score);
                }
            } catch (err) {
                console.warn('Не удалось записать счет в лидерборд:', err);
            }
        } else {
            console.log(`🏆 [Тест] Запись в лидерборд "${leaderboardName}": ${score}`);
        }
    }
}
