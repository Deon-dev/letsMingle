import * as AvatarPrimitive from '@radix-ui/react-avatar';

export default function Avatar({ src, alt }) {
  return (
    <AvatarPrimitive.Root className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 overflow-hidden">
      <AvatarPrimitive.Image className="h-full w-full object-cover" src={src} alt={alt}/>
      <AvatarPrimitive.Fallback className="text-sm">?</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
