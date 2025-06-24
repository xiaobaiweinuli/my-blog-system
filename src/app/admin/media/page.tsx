'use client';

import { useState, useRef, ChangeEvent, DragEvent, useEffect, Key } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Upload, Copy, Trash2, File as FileIcon, Loader2, ClipboardCopyIcon, Trash2Icon, X, FileText, FileArchive, FileAudio, FileVideo, FileCode2 } from 'lucide-react';
import Image from 'next/image';

interface MediaFile {
  key: Key | null | undefined;
  name: string;
  url: string;
  size: number;
  type: string;
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/media/list');
      if (!response.ok) throw new Error('Failed to fetch files.');
      const { data } = await response.json();
      const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
      if (!r2PublicUrl) {
        const errorMessage = '客户端配置错误：缺少R2公开URL (NEXT_PUBLIC_R2_PUBLIC_URL)';
        console.error(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // The API returns an array of R2Object objects in data.files
      const formattedFiles = data.files.map((obj: any) => {
        const fullFilename = obj.key;
        const lastDotIndex = fullFilename.lastIndexOf('.');
        
        // Extract name and extension, handle cases with no extension, including dotfiles like ".rar"
        const name = (lastDotIndex === -1) ? fullFilename : fullFilename.substring(0, lastDotIndex);
        const type = lastDotIndex !== -1 && lastDotIndex < fullFilename.length - 1 
            ? fullFilename.substring(lastDotIndex + 1) 
            : 'unknown';

        return {
          key: fullFilename, // Use full key for unique identification
          name: name, // Filename without extension
          url: `${r2PublicUrl}/api/r2/view?filename=${encodeURIComponent(fullFilename)}`,
          size: obj.size,
          type: type, // File extension
        };
      });
      setFiles(formattedFiles);
    } catch (error) {
      toast.error('无法加载文件列表。');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const FileTypeIcon = ({ type }: { type: string }) => {
    const lowerType = type.toLowerCase();
    let IconComponent;

    switch (lowerType) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        IconComponent = FileText;
        break;
      case 'zip':
      case 'rar':
      case '7z':
        IconComponent = FileArchive;
        break;
      case 'mp3':
      case 'wav':
      case 'ogg':
        IconComponent = FileAudio;
        break;
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'webm':
        IconComponent = FileVideo;
        break;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'json':
      case 'html':
      case 'css':
      case 'md':
        IconComponent = FileCode2;
        break;
      default:
        IconComponent = FileIcon;
    }

    return (
      <div className="flex items-center justify-center h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-md">
        <IconComponent className="h-8 w-8 text-gray-500" />
      </div>
    );
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sanitizeFilename = (filename: string) => {
    const lastDotIndex = filename.lastIndexOf('.');
    // Handle files with no extension or starting with a dot (e.g., .env, .gitignore)
    if (lastDotIndex <= 0) {
      return filename
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[\\/:*?"<>|]/g, ''); // Remove invalid filesystem characters
    }

    const name = filename.slice(0, lastDotIndex);
    const extension = filename.slice(lastDotIndex); // includes the dot

    const sanitizedName = name
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[\\/:*?"<>|]/g, ''); // Remove invalid filesystem characters

    return sanitizedName + extension;
  };

  const startUpload = async (overwrite = false, fileToProcess?: File) => {
    const file = fileToProcess || selectedFile;
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setShowOverwriteDialog(false);

    const sanitizedName = sanitizeFilename(file.name);
    const fileToUpload = new File([file], sanitizedName, { type: file.type });

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/media/upload', true);
    if (overwrite) {
      xhr.setRequestHeader('x-override', 'true');
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      setUploadProgress(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        toast.success(response.message || '文件上传成功！');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchFiles(); // Refresh the file list
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          toast.error(`上传失败: ${errorResponse.error || xhr.statusText}`);
        } catch (e) {
          toast.error(`上传失败: ${xhr.statusText}`);
        }
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setUploadProgress(null);
      toast.error('上传时发生网络错误。');
    };

    const formData = new FormData();
    formData.append('file', fileToUpload);
    xhr.send(formData);
  };

  const handleUpload = async (fileToUpload?: File) => {
    const file = fileToUpload || selectedFile;
    if (!file) return;

    // If the file comes from a drop, we need to set it to state for the dialog/UI to display the name
    if (fileToUpload) {
      setSelectedFile(fileToUpload);
    }

    const sanitizedName = sanitizeFilename(file.name);

    try {
      const checkResponse = await fetch(`/api/admin/media/check?filename=${encodeURIComponent(sanitizedName)}`);
      if (!checkResponse.ok) {
        const errorData = await checkResponse.json().catch(() => ({ error: '检查文件时发生未知错误' }));
        throw new Error(errorData.error || '检查文件是否存在时出错。');
      }
      const { exists } = await checkResponse.json();

      if (exists) {
        setShowOverwriteDialog(true);
      } else {
        // Pass the file object to startUpload
        startUpload(false, file);
      }
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL 已复制到剪贴板');
  };

  const handleDeleteClick = (file: MediaFile) => {
    setFileToDelete(file);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete || !fileToDelete.key) return;

    const fileToActuallyDelete = fileToDelete;
    const originalFiles = files;

    // Optimistically update the UI
    setFiles(currentFiles => currentFiles.filter(f => f.key !== fileToActuallyDelete.key));
    setFileToDelete(null); // Close dialog immediately

    try {
      const response = await fetch('/api/admin/media/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileToActuallyDelete.key }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `未能删除文件`);
      }

      toast.success(`文件 "${fileToActuallyDelete.name}" 已成功删除。`);
    } catch (error: any) {
      toast.error(`${error.message}: "${fileToActuallyDelete.name}"`);
      // Rollback on error
      setFiles(originalFiles);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Keep isDragging true while the user is dragging over the element
    setIsDragging(true); 
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <AlertDialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>文件已存在</AlertDialogTitle>
            <AlertDialogDescription>
              文件 "{selectedFile?.name}" 已存在。您想如何处理？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => startUpload(false)}>保留两者 (添加序号上传)</AlertDialogCancel>
            <AlertDialogAction onClick={() => startUpload(true)}>覆盖上传</AlertDialogAction>
          </AlertDialogFooter>
          <button
            onClick={() => setShowOverwriteDialog(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>你确定要删除这个文件吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。文件将被永久删除。
              <br />
              <strong className="mt-2 block break-all font-medium text-foreground">
                {fileToDelete?.name}.{fileToDelete?.type}
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Responsive and styled image preview modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full max-w-4xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-lg bg-white p-4 shadow-2xl dark:bg-gray-900">
              <button
                className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 shadow-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Enlarged view"
                  className="max-h-[85vh] max-w-full rounded-md object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <h1 className="text-3xl font-bold">媒体库</h1>

      <Card>
        <CardHeader><CardTitle>上传新文件</CardTitle></CardHeader>
        <CardContent>
          <div 
            className={`relative mt-4 flex justify-center rounded-lg border-2 border-dashed ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-600'} px-6 py-10 cursor-pointer transition-colors duration-200 ease-in-out`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">将文件拖放到此处，或 <span className="font-semibold text-primary">点击浏览</span></p>
            <Input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          </div>
          {selectedFile && !isUploading && (
            <div className="mt-4 flex items-center justify-center rounded-md bg-muted p-2 text-sm">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="ml-2 text-muted-foreground">({formatFileSize(selectedFile.size)})</p>
              <Button variant="ghost" size="icon" className="ml-2 h-6 w-6" onClick={handleRemoveSelectedFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isUploading && uploadProgress !== null && (
            <div className="mt-4 w-full">
                <p className="text-center text-sm mb-2">正在上传: {selectedFile?.name}</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                        className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
                <p className="text-xs text-right text-gray-500 mt-1">{uploadProgress}%</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button onClick={() => handleUpload()} disabled={isUploading || !selectedFile}>
              {isUploading ? '上传中...' : '上传文件'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>文件列表</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">预览</TableHead>
                  <TableHead>文件名</TableHead>
                  <TableHead>大小</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" /></TableCell></TableRow>
                ) : files.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center">未找到文件。</TableCell></TableRow>
                ) : (files.map((file) => {
                  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'];
                  const isImage = imageExtensions.includes(file.type.toLowerCase());


                  return (
                    <TableRow key={file.key}>
                                                                  <TableCell>
                        {isImage ? (
                          <button onClick={() => setSelectedImage(file.url)} className="cursor-pointer focus:outline-none">
                            <Image src={file.url} alt={file.name} width={64} height={64} className="rounded-md object-cover h-16 w-16" unoptimized />
                          </button>
                        ) : (
                          <FileTypeIcon type={file.type} />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{file.name}</TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>{file.type}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => {
                          navigator.clipboard.writeText(file.url);
                          toast.success('URL已复制到剪贴板');
                        }}>
                          <ClipboardCopyIcon className="h-4 w-4" />
                        </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(file)}>
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}