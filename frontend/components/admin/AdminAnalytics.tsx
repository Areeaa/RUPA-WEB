import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

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

        <div className="mt-8 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-6">
          <h3 className="mb-1 text-purple-900">Kategori Karya Terpopuler</h3>
          <p className="mb-4 text-sm text-purple-700">Diurutkan berdasarkan jumlah item terjual dari transaksi valid</p>
          <div className="space-y-3">
            {topCategories && topCategories.length > 0 ? (
              topCategories.map((cat, idx) => {
                const sold = Number(cat.total_sales || 0);
                const revenue = Number(cat.total_revenue || 0);
                const topProduct = cat.top_product;

                return (
                  <div key={cat.id || idx} className="flex items-center justify-between gap-4 rounded-xl bg-white/70 p-4 shadow-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-800">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-purple-950">{cat.name}</p>
                        <p className="truncate text-xs text-purple-600">
                          {topProduct ? `Produk terlaris: ${topProduct.name}` : 'Belum ada produk terjual'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-purple-950">{sold.toLocaleString('id-ID')} terjual</p>
                      <p className="text-xs text-purple-600">Rp {revenue.toLocaleString('id-ID')}</p>
                    </div>
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
