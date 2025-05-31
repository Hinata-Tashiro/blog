"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { admin } from "@/lib/api";
import { Image as ImageIcon, Search, X, Upload } from "lucide-react";
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

interface FeaturedImageSelectorProps {
  selectedImageId?: number;
  onImageSelect: (imageId: number | null) => void;
  disabled?: boolean;
}

export function FeaturedImageSelector({ 
  selectedImageId, 
  onImageSelect, 
  disabled = false 
}: FeaturedImageSelectorProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  // Find selected image
  useEffect(() => {
    if (selectedImageId && images.length > 0) {
      const image = images.find(img => img.id === selectedImageId);
      setSelectedImage(image || null);
    } else {
      setSelectedImage(null);
    }
  }, [selectedImageId, images]);

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
    onImageSelect(image.id);
    setSelectedImage(image);
    setIsDialogOpen(false);
  };

  const handleRemoveImage = () => {
    onImageSelect(null);
    setSelectedImage(null);
  };

  // Filter images based on search query
  const filteredImages = images.filter(image =>
    image.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    image.alt_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label>アイキャッチ画像</Label>
      
      {selectedImage ? (
        <Card className="relative overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-video relative bg-muted">
              <img
                src={`/uploads/images/${selectedImage.filename}`}
                alt={selectedImage.alt_text || selectedImage.original_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex gap-2">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleDialogOpen}
                        disabled={disabled}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        変更
                      </Button>
                    </DialogTrigger>
                    <ImageSelectorDialog
                      images={filteredImages}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      onImageClick={handleImageClick}
                      isLoading={isLoading}
                    />
                  </Dialog>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4 mr-2" />
                    削除
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium truncate">{selectedImage.original_name}</p>
              {selectedImage.alt_text && (
                <p className="text-xs text-muted-foreground truncate">
                  {selectedImage.alt_text}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer border-dashed border-2 hover:border-primary/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  アイキャッチ画像を選択
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDialogOpen}
                  disabled={disabled}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  画像を選択
                </Button>
              </CardContent>
            </Card>
          </DialogTrigger>
          <ImageSelectorDialog
            images={filteredImages}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onImageClick={handleImageClick}
            isLoading={isLoading}
          />
        </Dialog>
      )}
    </div>
  );
}

function ImageSelectorDialog({
  images,
  searchQuery,
  setSearchQuery,
  onImageClick,
  isLoading
}: {
  images: Image[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onImageClick: (image: Image) => void;
  isLoading: boolean;
}) {
  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle>アイキャッチ画像を選択</DialogTitle>
        <DialogDescription>
          使用する画像をクリックして選択してください
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="画像を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchQuery ? "検索条件に一致する画像が見つかりません" : "画像が登録されていません"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <Card 
                  key={image.id} 
                  className="cursor-pointer hover:ring-2 hover:ring-primary transition-all overflow-hidden"
                  onClick={() => onImageClick(image)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square relative bg-muted">
                      <img
                        src={`/uploads/images/${image.filename}`}
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
  );
}