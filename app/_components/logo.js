import Image from 'next/image';
import Link from 'next/link';

export function Logo({ size = 28, textClassName = 'text-lg font-bold text-slate-900', href = '/' }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity">
      <Image
        src="/logo.png"
        alt="AcadPK Logo"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
      <span className={textClassName}>AcadPK</span>
    </Link>
  );
}