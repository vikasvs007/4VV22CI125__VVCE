import { useState, useEffect } from 'react';
import { CreateShortUrl } from '@/components/CreateShortUrl';
import { UrlList } from '@/components/UrlList';
import { UrlStats } from '@/components/UrlStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { urlShortenerService } from '@/services/urlShortener';
import { useToast } from '@/hooks/use-toast';
import { Link, Zap, BarChart3, Globe, Github, FileText } from 'lucide-react';

type ViewMode = 'dashboard' | 'stats';

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedShortcode, setSelectedShortcode] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [totalUrls, setTotalUrls] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const urls = await urlShortenerService.getAllShortUrls();
        setTotalUrls(urls.length);
        setTotalClicks(urls.reduce((sum, url) => sum + url.clicks.length, 0));
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };
    
    loadStats();
  }, [refreshTrigger]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path !== '/' && path.length > 1) {
      const shortcode = path.substring(1);
      handleRedirect(shortcode);
    }
  }, []);

  const handleRedirect = async (shortcode: string) => {
    try {
      const originalUrl = await urlShortenerService.redirectToOriginalUrl(shortcode);
      
      toast({
        title: "Redirecting...",
        description: `Taking you to: ${originalUrl}`,
      });
      
      
      setTimeout(() => {
        window.open(originalUrl, '_blank');
        // Update URL back to dashboard
        window.history.pushState({}, '', '/');
        setRefreshTrigger(prev => prev + 1);
      }, 1500);
      
    } catch (error) {
      toast({
        title: "Redirect Failed",
        description: error instanceof Error ? error.message : "Short URL not found or expired",
        variant: "destructive",
      });
      
      // Update URL back to dashboard
      window.history.pushState({}, '', '/');
    }
  };

  const handleUrlCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleStatsView = (shortcode: string) => {
    setSelectedShortcode(shortcode);
    setViewMode('stats');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setSelectedShortcode('');
  };

  if (viewMode === 'stats') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <UrlStats shortcode={selectedShortcode} onBack={handleBackToDashboard} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Link className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Affordmed URL Shortener
                </h1>
                <p className="text-sm text-muted-foreground">
                  Microservice Demo - Campus Hiring Assessment
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="hidden sm:flex">
                <Zap className="h-3 w-3 mr-1" />
                React + TypeScript
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://github.com', '_blank')}
                className="gap-2"
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">View Backend Code</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Link className="h-4 w-4 text-primary" />
                Total URLs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{totalUrls}</p>
              <p className="text-xs text-muted-foreground mt-1">Shortened URLs created</p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Total Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{totalClicks}</p>
              <p className="text-xs text-muted-foreground mt-1">Across all URLs</p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                API Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-success rounded-full animate-pulse"></div>
                <p className="text-sm font-medium text-success">All Systems Operational</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Simulated API endpoints</p>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints Reference */}
        <Card className="mb-8 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              API Endpoints Reference
            </CardTitle>
            <CardDescription>
              These are the endpoints your Node.js backend should implement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Badge className="bg-green-500/10 text-green-700 border-green-500/20">POST</Badge>
                <code className="block text-sm bg-muted p-2 rounded font-mono">
                  /shorturls
                </code>
                <p className="text-xs text-muted-foreground">Create short URL</p>
              </div>
              
              <div className="space-y-2">
                <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">GET</Badge>
                <code className="block text-sm bg-muted p-2 rounded font-mono">
                  /shorturls/:shortcode
                </code>
                <p className="text-xs text-muted-foreground">Get URL statistics</p>
              </div>
              
              <div className="space-y-2">
                <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20">GET</Badge>
                <code className="block text-sm bg-muted p-2 rounded font-mono">
                  /:shortcode
                </code>
                <p className="text-xs text-muted-foreground">Redirect to original URL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <CreateShortUrl onUrlCreated={handleUrlCreated} />
          </div>
          
          <div>
            <UrlList 
              refreshTrigger={refreshTrigger} 
              onStatsView={handleStatsView}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
