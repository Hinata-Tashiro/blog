"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { admin, getImageUrl } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Image as ImageIcon, Search, Upload, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Image {
  id: number;
  filename: string;
  original_name: string;
  alt_text?: string;
  caption?: string;
  width?: number;
  height?: number;
  created_at: string;
}

interface ImageGalleryDialogProps {
  onImageSelect: (imageUrl: string, altText: string) => void;
  trigger?: React.ReactNode;
}

export function ImageGalleryDialog({ onImageSelect, trigger }: ImageGalleryDialogProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch images when dialog opens
  const fetchImages = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const data = await admin.images.list();
      setImages(data);
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
    fetchImages();
  };

  const handleImageClick = (image: Image) => {
    const imageUrl = getImageUrl(image.filename);
    const altText = image.alt_text || image.original_name;
    onImageSelect(imageUrl, altText);
    setIsDialogOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const altText = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      const result = await admin.images.upload(file, altText);
      
      toast({
        title: "アップロード完了",
        description: "画像をアップロードしました",
      });
      
      // Clear the input
      e.target.value = '';
      
      // Refresh the image list
      await fetchImages();
      
      // Auto-select the uploaded image
      const imageUrl = result.url;
      onImageSelect(imageUrl, altText);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "エラー",
        description: "画像のアップロードに失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Filter images based on search query
  const filteredImages = images.filter(image =>
    image.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    image.alt_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild onClick={handleDialogOpen}>
        {trigger || (
          <Button type="button" variant="outline" size="sm">
            <ImageIcon className="h-4 w-4 mr-2" />
            画像を挿入
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>画像を挿入</DialogTitle>
          <DialogDescription>
            使用する画像をクリックして選択するか、新しい画像をアップロードしてください
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="画像を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => document.getElementById('gallery-image-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'アップロード中...' : '新しい画像'}
              </Button>
              <input
                id="gallery-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">読み込み中...</p>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchQuery ? "検索条件に一致する画像が見つかりません" : "画像が登録されていません"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map((image) => (
                  <Card 
                    key={image.id} 
                    className="cursor-pointer hover:ring-2 hover:ring-primary transition-all overflow-hidden"
                    onClick={() => handleImageClick(image)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square relative bg-muted">
                        <img
                          src={getImageUrl(image.filename)}
                          alt={image.alt_text || image.original_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate" title={image.original_name}>
                          {image.original_name}
                        </p>
                        {image.width && image.height && (
                          <p className="text-xs text-muted-foreground">
                            {image.width} × {image.height}px
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}