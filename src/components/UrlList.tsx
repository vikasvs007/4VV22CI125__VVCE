import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { urlShortenerService, type ShortUrl } from '@/services/urlShortener';
import { Copy, ExternalLink, Trash2, BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react';

interface UrlListProps {
  refreshTrigger: number;
  onStatsView: (shortcode: string) => void;
}

export function UrlList({ refreshTrigger, onStatsView }: UrlListProps) {
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadUrls = async () => {
    setIsLoading(true);
    try {
      const allUrls = await urlShortenerService.getAllShortUrls();
      setUrls(allUrls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load URLs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUrls();
  }, [refreshTrigger]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const deleteUrl = async (shortcode: string) => {
    try {
      await urlShortenerService.deleteShortUrl(shortcode);
      await loadUrls();
      toast({
        title: "Deleted",
        description: "Short URL deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete URL",
        variant: "destructive",
      });
    }
  };

  const openOriginalUrl = async (shortcode: string) => {
    try {
      const originalUrl = await urlShortenerService.redirectToOriginalUrl(shortcode);
      window.open(originalUrl, '_blank');
      // Reload to show updated click count
      setTimeout(loadUrls, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to redirect",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading URLs...</p>
        </CardContent>
      </Card>
    );
  }

  if (urls.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No URLs created yet</p>
            <p className="text-sm">Create your first short URL above to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Your Short URLs ({urls.length})
          </CardTitle>
          <CardDescription>
            Manage and track your shortened URLs
          </CardDescription>
        </CardHeader>
      </Card>

      {urls.map((url) => (
        <Card key={url.id} className="shadow-elegant hover:shadow-glow transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {url.shortcode}
                  </code>
                  {url.isActive ? (
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
                  <Badge variant="outline" className="text-xs">
                    {url.clicks.length} clicks
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground truncate mb-1">
                  <strong>Original:</strong> {url.originalUrl}
                </p>
                <p className="text-sm text-muted-foreground truncate mb-2">
                  <strong>Short:</strong> {url.shortLink}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created: {new Date(url.createdAt).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Expires: {new Date(url.expiry).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(url.shortLink)}
                  className="gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openOriginalUrl(url.shortcode)}
                  disabled={!url.isActive}
                  className="gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Visit
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatsView(url.shortcode)}
                  className="gap-1"
                >
                  <BarChart3 className="h-3 w-3" />
                  Stats
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteUrl(url.shortcode)}
                  className="gap-1 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}