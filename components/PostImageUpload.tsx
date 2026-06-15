// 1. Import
import PostImageUpload from "@/components/PostImageUpload";

// 2. State（在現有 state 旁邊）
const [postImageUrl, setPostImageUrl] = useState<string | null>(null);

// 3. JSX — 放在 textarea 下方，送出按鈕上方
<PostImageUpload
  userId={user.id}
  value={postImageUrl}
  onChange={setPostImageUrl}
/>;

// 4. 送出時一起帶入 posts insert
await supabase.from("posts").insert({
  user_id: user.id,
  content: postContent,
  image_url: postImageUrl, // ← 這樣就完成了
  event_id: linkedEventId ?? null,
});

// 5. 送出後 reset
setPostImageUrl(null);
