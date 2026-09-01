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
    private leaderboard: any = null;

    public isInitialized: boolean = false;
    private lastAdTime: number = 0;

    public async init(): Promise<void> {
        try {
            if (window.YaGames) {
                this.ysdk = await window.YaGames.init();
                this.isInitialized = true;
                
                // Сообщаем Яндексу, что игра загрузилась
                this.ysdk.features.LoadingAPI?.ready();

                // Инициализация игрока
                try {
                    this.player = await this.ysdk.getPlayer();
                } catch (e) {
                    console.log('Игрок не авторизован');
                }

                // Инициализация лидерборда
                try {
                    this.leaderboard = await this.ysdk.getLeaderboards();
                } catch (e) {
                    console.log('Лидерборды недоступны');
                }

                console.log('✅ Yandex Games SDK успешно подключен!');
            } else {
                console.log('ℹ️ Режим локального тестирования (SDK Яндекса не обнаружен)');
            }
        } catch (error) {
            console.warn('Ошибка инициализации SDK:', error);
        }
    }

    // Полноэкранная реклама (Interstitial) с таймером в 70 секунд
    public showFullscreenAd(onOpen?: () => void, onClose?: () => void): void {
        const now = Date.now();
        if (now - this.lastAdTime < 70000) {
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
            // Локальный тест: сразу даем награду
            const confirmAd = confirm('Тестовая реклама за награду: Спасти стрик?');
            if (confirmAd) onRewarded();
            onClose?.();
        }
    }

    // Отправка лучшего стрика в Лидерборд Яндекса
    public async submitScore(leaderboardName: string, score: number): Promise<void> {
        if (this.ysdk && this.leaderboard) {
            try {
                await this.ysdk.setLeaderboardScore(leaderboardName, score);
            } catch (err) {
                console.warn('Не удалось записать счет в лидерборд:', err);
            }
        }
    }
}
