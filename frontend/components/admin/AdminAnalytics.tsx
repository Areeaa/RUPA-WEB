import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';

type AdminAnalyticsProps = {
  dailyTransactions?: any[];
  systemStats?: any;
  topCategories?: any[];
};

export function AdminAnalytics({ dailyTransactions = [], systemStats = {}, topCategories = [] }: AdminAnalyticsProps) {
  const todayTx = dailyTransactions?.length > 0 ? dailyTransactions[dailyTransactions.length - 1].total_transactions : 0;
  
  return (
    <Card className="rounded-2xl shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-green-800">Analitik Donasi & Transaksi</CardTitle>
        <CardDescription>Visualisasi performa platform RUPA</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div className="text-sm text-green-700 mb-2">Total Pendapatan/Donasi</div>
            <div className="text-2xl text-green-900">{systemStats?.totalDonations || 'Rp 0'}</div>
          </div>
          <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
            <div className="text-sm text-orange-700 mb-2">Transaksi Tercatat (All-time)</div>
            <div className="text-2xl text-orange-900">{systemStats?.totalTransactions || 0}</div>
          </div>
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="text-sm text-blue-700 mb-2">Order Hari Ini</div>
            <div className="text-2xl text-blue-900">{todayTx}</div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
          <h3 className="text-purple-900 mb-4">Kategori Karya Terpopuler</h3>
          <div className="space-y-4">
            {topCategories && topCategories.length > 0 ? (
              topCategories.map((cat, idx) => {
                const topProduct = cat.Products?.[0];
                const sold = topProduct?.sold_count || 0;
                // Hitung persen relatif dari item tertinggi
                const maxSold = topCategories[0]?.Products?.[0]?.sold_count || 100;
                const percentage = Math.min(Math.round((sold / maxSold) * 100) || 10, 100);

                return (
                  <div key={cat.id || idx}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-purple-800">{cat.name}</span>
                      <span className="text-sm text-purple-900">{topProduct ? `${sold} terjual` : '0 terjual'}</span>
                    </div>
                    {topProduct && (
                      <p className="text-xs text-purple-600 mb-2 truncate">Paling laris: {topProduct.name}</p>
                    )}
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-purple-700">Belum ada data kategori terpopuler.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
