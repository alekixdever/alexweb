type Props = {
  count: number
  onIncrease: () => void
}

export default function CounterButton({
  count,
  onIncrease,
}: Props) {
  return (
    <button
      onClick={onIncrease}
      className="mt-5 bg-black text-white px-4 py-2 rounded-xl"
    >
      Count: {count}
    </button>
  )
}
