import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function PostsTableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell className="text-center">
            <Skeleton className="h-5 w-5 mx-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/4 mt-2" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-32" />
          </TableCell>
          <TableCell className="text-center">
            <Skeleton className="h-8 w-8 mx-auto" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
