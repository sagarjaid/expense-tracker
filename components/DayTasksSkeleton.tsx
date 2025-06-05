/** @format */

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DayTasksSkeleton() {
  return (
    <Card className='mb-6'>
      <CardContent className='pt-4'>
        <div className='text-xl font-bold mb-3'>
          <Skeleton className='h-4 w-44 mb-2' />
        </div>
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='flex text-sm items-center gap-2'>
              <Skeleton className='h-4 w-4 rounded-md' />
              <Skeleton className='h-4 w-32' />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
