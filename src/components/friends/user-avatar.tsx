export function UserAvatar({
  name,
  image,
  size = 40,
}: {
  name: string;
  image?: string | null;
  size?: number;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-white/10 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}
