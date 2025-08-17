import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { urlShortenerService } from '@/services/urlShortener';
import { ArrowLeft, BarChart3, Mouse, Clock, MapPin, Globe, CheckCircle, XCircle } from 'lucide-react';

// Props: { shortcode: string, onBack: function }

export function UrlStats({ shortcode, onBack }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await urlShortenerService.getShortUrlStats(shortcode);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [shortcode]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading statistics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <Button variant="outline" onClick={onBack} className="w-fit gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to URLs
          </Button>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-lg font-medium text-destructive">Error Loading Statistics</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to URLs
            </Button>
            
            {stats.isActive ? (
              <Badge variant="default" className="bg-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Expired
              </Badge>
            )}
          </div>
          
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="h-6 w-6 text-primary" />
            URL Statistics: {stats.shortcode}
          </CardTitle>
          <CardDescription>
            Detailed analytics for your shortened URL
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mouse className="h-4 w-4 text-primary" />
              Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{stats.totalClicks}</p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{new Date(stats.createdAt).toLocaleDateString()}</p>
            <p className="text-xs text-muted-foreground">{new Date(stats.createdAt).toLocaleTimeString()}</p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Expires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{new Date(stats.expiry).toLocaleDateString()}</p>
            <p className="text-xs text-muted-foreground">{new Date(stats.expiry).toLocaleTimeString()}</p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm font-medium ${stats.isActive ? 'text-success' : 'text-destructive'}`}>
              {stats.isActive ? 'Active' : 'Expired'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* URL Details */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>URL Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Short URL</h4>
            <p className="font-mono text-sm bg-muted p-2 rounded break-all">{stats.shortLink}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Original URL</h4>
            <p className="font-mono text-sm bg-muted p-2 rounded break-all">{stats.originalUrl}</p>
          </div>
        </CardContent>
      </Card>

      {/* Click History */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mouse className="h-5 w-5 text-primary" />
            Click History ({stats.clicks.length})
          </CardTitle>
          <CardDescription>
            Detailed information about each click on your short URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.clicks.length === 0 ? (
            <div className="text-center py-8">
              <Mouse className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No clicks recorded yet</p>
              <p className="text-sm text-muted-foreground mt-1">Share your short URL to start tracking clicks!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </TableHead>
                    <TableHead>User Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.clicks.map((click, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {new Date(click.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {click.referrer}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {click.location}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-xs truncate">
                        {click.userAgent}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}