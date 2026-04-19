import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

type AdminReportsProps = {
  recentReports: any[];
};

export function AdminReports({ recentReports }: AdminReportsProps) {
  return (
    <Card className="rounded-2xl shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-green-800">Konten Dilaporkan</CardTitle>
        <CardDescription>Kelola laporan dari pengguna</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jenis Laporan</TableHead>
              <TableHead>Kreator</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report.type}</TableCell>
                <TableCell>{report.creator}</TableCell>
                <TableCell>{report.date}</TableCell>
                <TableCell>
                  {report.status === 'Pending' ? (
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" className="rounded-lg">
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
