"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { admin, getImageUrl } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
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

  // Fetch images on mount if selectedImageId is provided
  useEffect(() => {
    if (selectedImageId && images.length === 0) {
      fetchImages();
    }
  }, [selectedImageId]);

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

  const handleImageClick = (image: Image, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onImageSelect(image.id);
    setSelectedImage(image);
    setIsDialogOpen(false);
  };

  const handleRemoveImage = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
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
                src={getImageUrl(selectedImage.filename)}
                alt={selectedImage.alt_text || selectedImage.original_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex gap-2">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
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
                      onImageUploaded={fetchImages}
                    />
                  </Dialog>
                  
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={(e) => handleRemoveImage(e)}
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
                  type="button"
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
            onImageUploaded={fetchImages}
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
  isLoading,
  onImageUploaded
}: {
  images: Image[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onImageClick: (image: Image, e?: React.MouseEvent) => void;
  isLoading: boolean;
  onImageUploaded?: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const altText = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      await admin.images.upload(file, altText);
      
      toast({
        title: "アップロード完了",
        description: "画像をアップロードしました",
      });
      
      // Clear the input
      e.target.value = '';
      
      // Refresh the image list
      if (onImageUploaded) {
        onImageUploaded();
      }
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

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle>アイキャッチ画像を選択</DialogTitle>
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
              onClick={() => document.getElementById('dialog-image-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'アップロード中...' : '新しい画像'}
            </Button>
            <input
              id="dialog-image-upload"
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
                  onClick={(e) => onImageClick(image, e)}
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
  );
}