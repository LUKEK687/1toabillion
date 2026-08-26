export const AdService = {
  showRewardedAd: async (): Promise<boolean> => {
    // In a production app, this would use a real provider (e.g. expo-ads-admob).
    // For this offline game, we simulate an ad viewing delay.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1500);
    });
  }
};