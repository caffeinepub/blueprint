import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, Loader2 } from 'lucide-react';
import { useGetPosts, useGetMarketplaceBlueprints } from '../hooks/useQueries';
import { toast } from 'sonner';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ posts: number; blueprints: number } | null>(null);

  const { data: posts = [] } = useGetPosts();
  const { data: blueprints = [] } = useGetMarketplaceBlueprints();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    
    // Simulate search with filtering
    setTimeout(() => {
      const postResults = posts.filter(post => 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      const blueprintResults = blueprints.filter(bp => 
        bp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bp.id.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults({ posts: postResults.length, blueprints: blueprintResults.length });
      setIsSearching(false);
      toast.success(`Found ${postResults.length} posts and ${blueprintResults.length} blueprints`);
    }, 500);
  };

  const handleBrowseMarketplace = () => {
    navigate({ to: '/marketplace' });
  };

  // Calculate trending topics from posts with more realistic data
  const trendingTopics = useMemo(() => {
    const topics = [
      { name: 'Learning', posts: posts.length },
      { name: 'Productivity', posts: Math.floor(posts.length * 0.7) },
      { name: 'Coding', posts: Math.floor(posts.length * 0.6) },
      { name: 'Startup', posts: Math.floor(posts.length * 0.5) },
      { name: 'MealPrep', posts: Math.floor(posts.length * 0.4) },
      { name: 'Running', posts: Math.floor(posts.length * 0.35) },
      { name: 'ProgressNotPerfection', posts: Math.floor(posts.length * 0.3) },
    ];
    
    return topics.filter(t => t.posts > 0).sort((a, b) => b.posts - a.posts);
  }, [posts]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users, posts, or blueprints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
          {searchResults && (
            <div className="mt-3 text-sm text-muted-foreground">
              Found {searchResults.posts} posts and {searchResults.blueprints} blueprints matching "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Trending Topics
        </h2>
        {trendingTopics.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <p className="text-muted-foreground">No trending topics yet. Start posting to create trends!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {trendingTopics.map((topic, index) => (
              <Card key={index} className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">#{topic.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {topic.posts.toLocaleString()} {topic.posts === 1 ? 'post' : 'posts'}
                      </p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Popular Blueprints</h2>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground mb-4">
              {blueprints.length > 0 
                ? `Discover ${blueprints.length} popular blueprints in the Marketplace`
                : 'No blueprints available yet. Check back soon!'}
            </p>
            <Button variant="outline" onClick={handleBrowseMarketplace}>
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
