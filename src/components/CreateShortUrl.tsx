import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { urlShortenerService, type CreateShortUrlRequest } from '@/services/urlShortener';
import { Copy, Link, Clock, Zap } from 'lucide-react';

interface CreateShortUrlProps {
  onUrlCreated: () => void;
}

export function CreateShortUrl({ onUrlCreated }: CreateShortUrlProps) {
  const [formData, setFormData] = useState<CreateShortUrlRequest>({
    url: '',
    validity: 30,
    shortcode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ shortLink: string; expiry: string } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await urlShortenerService.createShortUrl(formData);
      setResult(response);
      setFormData({ url: '', validity: 30, shortcode: '' });
      onUrlCreated();
      
      toast({
        title: "Short URL Created!",
        description: "Your URL has been shortened successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create short URL",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Short URL copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-elegant">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            <Link className="h-6 w-6 text-primary" />
            Create Short URL
          </CardTitle>
          <CardDescription>
            Transform long URLs into short, shareable links with custom options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Original URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/very-long-url..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validity" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Validity (minutes)
                </Label>
                <Input
                  id="validity"
                  type="number"
                  min="1"
                  max="43200"
                  placeholder="30"
                  value={formData.validity || ''}
                  onChange={(e) => setFormData({ ...formData, validity: parseInt(e.target.value) || undefined })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortcode" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Custom Shortcode (optional)
                </Label>
                <Input
                  id="shortcode"
                  type="text"
                  placeholder="my-custom-code"
                  value={formData.shortcode}
                  onChange={(e) => setFormData({ ...formData, shortcode: e.target.value })}
                  pattern="[a-zA-Z0-9]{3,20}"
                  title="3-20 alphanumeric characters"
                  className="h-12"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !formData.url}
              className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:shadow-glow transition-all duration-300"
            >
              {isLoading ? "Creating..." : "Shorten URL"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-success shadow-elegant">
          <CardHeader>
            <CardTitle className="text-success flex items-center gap-2">
              <Link className="h-5 w-5" />
              Short URL Created Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Short URL</Label>
              <div className="flex gap-2">
                <Input value={result.shortLink} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(result.shortLink)}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Expires At</Label>
              <Input 
                value={new Date(result.expiry).toLocaleString()} 
                readOnly 
                className="text-muted-foreground"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}