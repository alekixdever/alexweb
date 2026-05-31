"use client";

import { X, ChevronRight } from "lucide-react";
import { useState } from "react";

type Page = "company" | "about" | "contact" | "faq" | "terms" | null;

interface Props {
  open: boolean;
  onClose: () => void;
}

// ── Section components ──────────────────────────────

function SectionTitle({ en, ja }: { en: string; ja: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "var(--fg-primary)",
          letterSpacing: "-0.02em",
          marginBottom: 4,
        }}
      >
        {en}
      </h2>
      <p style={{ fontSize: 13, color: "var(--fg-muted)" }}>{ja}</p>
      <div
        style={{
          height: 2,
          width: 40,
          marginTop: 10,
          background: "linear-gradient(90deg, var(--accent), var(--accent2))",
          borderRadius: 99,
        }}
      />
    </div>
  );
}

function BilingualBlock({ en, ja }: { en: string; ja: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p
        style={{
          fontSize: 13,
          color: "var(--fg-secondary)",
          lineHeight: 1.8,
          marginBottom: 8,
        }}
      >
        {en}
      </p>
      <p style={{ fontSize: 12, color: "var(--fg-muted)", lineHeight: 1.8 }}>
        {ja}
      </p>
    </div>
  );
}

function BulletList({ items }: { items: [string, string][] }) {
  return (
    <ul
      style={{
        listStyle: "none",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginBottom: 16,
      }}
    >
      {items.map(([en, ja], i) => (
        <li
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "8px 12px",
            background: "var(--bg-glass)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              flexShrink: 0,
              marginTop: 5,
              background: "var(--accent)",
              boxShadow: "0 0 6px var(--accent-glow)",
            }}
          />
          <div>
            <p style={{ fontSize: 13, color: "var(--fg-secondary)" }}>{en}</p>
            <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>{ja}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SubTitle({ en, ja }: { en: string; ja: string }) {
  return (
    <div style={{ marginBottom: 10, marginTop: 20 }}>
      <h3
        style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-bright)" }}
      >
        {en}
      </h3>
      <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>{ja}</p>
    </div>
  );
}

// ── Pages ───────────────────────────────────────────

function CompanyPage() {
  return (
    <div>
      <SectionTitle en="Company Information" ja="会社情報" />
      {/* Logo */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: "var(--radius)",
            overflow: "hidden",
            border: "1px solid var(--border)",
            background: "#f5f0e8",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <img
            src="/tenjinshosai.png"
            alt="天神書齋 Tenjin Shosai"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: 8,
            }}
          />
        </div>
      </div>

      {/* Company photo */}
      <div
        style={{
          width: "100%",
          height: 180,
          borderRadius: "var(--radius)",
          overflow: "hidden",
          marginBottom: 20,
          border: "1px solid var(--border)",
        }}
      >
        <img
          src="/company.jpg"
          alt="Company"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <SubTitle en="Company Overview" ja="会社概要" />
      <BilingualBlock
        en="We operate a café and a multi-purpose rental space designed to bring people together through culture, learning, and community activities. Located next to our café, the venue provides a welcoming environment for cultural classes, workshops, seminars, and private events."
        ja="私たちは、カフェ運営とレンタルスペース事業を通じて、人々が集い、学び、交流できる場所づくりを行っています。カフェに隣接する独立スペースは、書道、茶道、華道をはじめとする日本文化の活動や、ワークショップ、講座など様々な用途でご利用いただけます。"
      />
      <SubTitle en="Our Services" ja="事業内容" />
      <BulletList
        items={[
          ["Café Operations", "カフェ運営"],
          ["Venue Rental", "レンタルスペース運営"],
          ["Cultural & Arts Activities", "文化・芸術活動支援"],
          ["Workshops & Events", "ワークショップ・イベント開催"],
          ["Community Engagement Programs", "地域交流活動"],
        ]}
      />
      <SubTitle en="Suitable For" ja="ご利用用途" />
      <BulletList
        items={[
          ["Calligraphy Classes", "書道教室"],
          ["Tea Ceremony Sessions", "茶道教室"],
          ["Flower Arrangement Classes", "華道教室"],
          ["Workshops & Seminars", "ワークショップ・セミナー"],
          ["Small Events & Community Gatherings", "小規模イベント・地域交流会"],
        ]}
      />
      <div
        style={{
          padding: "14px 16px",
          background: "rgba(139,92,246,0.08)",
          border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: "var(--radius-sm)",
          marginTop: 8,
        }}
      >
        {[
          ["Location / 所在地", "[Insert Address / 所在地をご記入ください]"],
          [
            "Business Hours / 営業時間",
            "[Insert Hours / 営業時間をご記入ください]",
          ],
          [
            "Contact / お問い合わせ",
            "[Insert Contact / 連絡先をご記入ください]",
          ],
        ].map(([label, val]) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <p
              style={{
                fontSize: 11,
                color: "var(--accent-bright)",
                fontWeight: 600,
              }}
            >
              {label}
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-muted)" }}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div>
      <SectionTitle en="About Us" ja="私たちについて" />
      <div
        style={{
          width: "100%",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          marginBottom: 20,
          border: "1px solid var(--border)",
          position: "relative",
          maxHeight: 400,
          display: "flex",
          justifyContent: "center",
          background: "var(--bg-glass)",
        }}
      >
        <img
          src="/about-us.jpg"
          alt="About Us"
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
      <SubTitle
        en="Connecting People Through Culture"
        ja="人と文化をつなぐ場所を目指して"
      />
      <BilingualBlock
        en="We are a small company founded by a team of six young individuals who share a common vision: creating meaningful spaces where people can connect, learn, and grow together."
        ja="私たちは、六人の若いメンバーによって設立された小さなチームです。人と人が直接出会い、同じ時間や空間を共有する機会をつくることを目指しています。"
      />
      <BilingualBlock
        en="In today's fast-moving world, opportunities for genuine face-to-face interaction are becoming increasingly rare. We believe there is still great value in sharing the same space, exchanging ideas, and building relationships in person."
        ja="現代社会では、便利なサービスやオンライン上のつながりが増える一方で、人と人が直接出会い、同じ時間や空間を共有する機会は少なくなっていると感じています。"
      />
      <BilingualBlock
        en="From calligraphy and tea ceremonies to flower arrangement, workshops, and community events — we hope this space becomes a place where creativity, culture, and human connections can flourish."
        ja="書道や茶道、華道といった伝統文化を学ぶ機会だけでなく、新しい趣味との出会い、地域との交流、そして人と人との新たなつながりが生まれます。"
      />
      <div
        style={{
          padding: "16px",
          marginTop: 8,
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.06))",
          border: "1px solid var(--border-hover)",
          borderRadius: "var(--radius)",
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: "var(--fg-secondary)",
            lineHeight: 1.8,
            fontStyle: "italic",
            marginBottom: 8,
          }}
        >
          "A meaningful conversation may begin over a cup of coffee.
          <br />A lifelong friendship may start at a single event."
        </p>
        <p
          style={{
            fontSize: 11,
            color: "var(--fg-muted)",
            lineHeight: 1.8,
            fontStyle: "italic",
          }}
        >
          「一杯のコーヒーから始まる会話。ひとつのイベントから生まれる友情。」
        </p>
      </div>
    </div>
  );
}

function ContactPage() {
  return (
    <div>
      <SectionTitle en="Contact Us" ja="お問い合わせ" />
      <BilingualBlock
        en="We'd love to hear from you. Please fill in the form below and we'll get back to you as soon as possible."
        ja="お気軽にお問い合わせください。以下のフォームにご記入いただければ、できる限り早くご返信いたします。"
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 8,
        }}
      >
        {[
          {
            label: "Name / お名前",
            ja: "Your full name",
            type: "text",
            placeholder: "Alex Chen",
          },
          {
            label: "Email / メールアドレス",
            ja: "We'll reply to this address",
            type: "email",
            placeholder: "your@email.com",
          },
        ].map((field) => (
          <div key={field.label}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--fg-secondary)",
                display: "block",
                marginBottom: 6,
              }}
            >
              {field.label}
              <span
                style={{
                  fontSize: 10,
                  color: "var(--fg-muted)",
                  fontWeight: 400,
                  marginLeft: 6,
                }}
              >
                {field.ja}
              </span>
            </label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--bg-glass)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--fg-primary)",
                fontSize: 13,
                outline: "none",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-hover)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            />
          </div>
        ))}
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--fg-secondary)",
              display: "block",
              marginBottom: 6,
            }}
          >
            Subject / 件名
            <span
              style={{
                fontSize: 10,
                color: "var(--fg-muted)",
                fontWeight: 400,
                marginLeft: 6,
              }}
            >
              Topic of your inquiry
            </span>
          </label>
          <select
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--bg-layer2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--fg-primary)",
              fontSize: 13,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">Select a topic / トピックを選択</option>
            <option value="venue">Venue Rental / 会場レンタル</option>
            <option value="event">Event Inquiry / イベントについて</option>
            <option value="cafe">Café / カフェについて</option>
            <option value="partnership">Partnership / パートナーシップ</option>
            <option value="other">Other / その他</option>
          </select>
        </div>
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--fg-secondary)",
              display: "block",
              marginBottom: 6,
            }}
          >
            Message / メッセージ
          </label>
          <textarea
            rows={5}
            placeholder="Write your message here... / メッセージをご記入ください..."
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--fg-primary)",
              fontSize: 13,
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--border-hover)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          />
        </div>
        <button
          className="btn-primary"
          style={{ width: "100%", padding: "12px", fontSize: 14 }}
        >
          Send Message / 送信する
        </button>
        <p
          style={{
            fontSize: 11,
            color: "var(--fg-muted)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          We typically respond within 1–2 business days.
          <br />
          通常1〜2営業日以内にご返信いたします。
        </p>
      </div>
    </div>
  );
}

function FAQPage() {
  const faqs: [string, string, string, string][] = [
    [
      "How do I join an event?",
      "イベントに参加するには？",
      "Create a free account and click 'Join Event' on any event card. You'll receive a confirmation once registered.",
      "無料アカウントを作成し、イベントカードの「参加する」をクリックしてください。登録完了後に確認メッセージが届きます。",
    ],
    [
      "Can I host my own event?",
      "イベントを主催できますか？",
      "Yes! Logged-in members can create events. Click 'New Event' in the header to get started.",
      "はい、ログインしたメンバーはイベントを作成できます。ヘッダーの「New Event」からお始めください。",
    ],
    [
      "How do I rent the venue?",
      "会場はどのように借りられますか？",
      "Please contact us via the Contact form with your preferred date, time, and purpose. We'll get back to you within 1–2 business days.",
      "お問い合わせフォームから希望日時と目的をご連絡ください。1〜2営業日以内にご返信いたします。",
    ],
    [
      "Is there a membership fee?",
      "会費はかかりますか？",
      "Basic membership is completely free. Premium features may be introduced in the future.",
      "基本会員登録は完全無料です。将来的にプレミアム機能を導入する場合があります。",
    ],
    [
      "What languages are supported?",
      "対応言語は？",
      "The platform supports English and Japanese. More languages may be added in the future.",
      "現在、英語と日本語に対応しています。今後他の言語も追加される予定です。",
    ],
    [
      "How do I cancel event participation?",
      "参加キャンセルの方法は？",
      "You can cancel your participation from the event page. Please cancel at least 24 hours in advance where possible.",
      "イベントページからキャンセルできます。できる限り24時間前までにキャンセルをお願いします。",
    ],
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      <SectionTitle en="FAQ" ja="よくある質問" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {faqs.map(([en, ja, ansEn, ansJa], i) => (
          <div
            key={i}
            style={{
              background: "var(--bg-glass)",
              border: `1px solid ${open === i ? "var(--border-hover)" : "var(--border)"}`,
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              transition: "border-color 0.2s",
            }}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: "100%",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                gap: 10,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--fg-primary)",
                    marginBottom: 2,
                  }}
                >
                  {en}
                </p>
                <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>{ja}</p>
              </div>
              <ChevronRight
                size={14}
                style={{
                  color: "var(--fg-muted)",
                  flexShrink: 0,
                  transform: open === i ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>
            {open === i && (
              <div
                style={{
                  padding: "0 14px 14px",
                  borderTop: "1px solid var(--border)",
                  paddingTop: 12,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--fg-secondary)",
                    lineHeight: 1.7,
                    marginBottom: 8,
                  }}
                >
                  {ansEn}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--fg-muted)",
                    lineHeight: 1.7,
                  }}
                >
                  {ansJa}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TermsPage() {
  return (
    <div>
      <SectionTitle en="Terms of Use & Disclaimer" ja="利用規約・免責事項" />
      <p style={{ fontSize: 11, color: "var(--fg-muted)", marginBottom: 20 }}>
        Last updated / 最終更新日: 2026-05-29
      </p>

      {[
        {
          en: "1. Acceptance of Terms",
          ja: "第1条（利用規約への同意）",
          bodyEn:
            "By accessing or using this platform, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use this service.",
          bodyJa:
            "本プラットフォームにアクセスまたはご利用いただくことで、本利用規約に同意したものとみなします。同意いただけない場合は、本サービスのご利用をお控えください。",
        },
        {
          en: "2. Use of Service",
          ja: "第2条（サービスの利用）",
          bodyEn:
            "Users agree to use this platform only for lawful purposes and in a manner that does not infringe the rights of others. Prohibited activities include harassment, spam, and any illegal conduct.",
          bodyJa:
            "ユーザーは、本プラットフォームを合法的な目的のみに使用し、他者の権利を侵害しない方法で利用することに同意します。嫌がらせ、スパム行為、その他の違法行為は禁止されています。",
        },
        {
          en: "3. User Accounts",
          ja: "第3条（ユーザーアカウント）",
          bodyEn:
            "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
          bodyJa:
            "ユーザーは、アカウント情報の機密性を維持し、アカウントで行われるすべての活動に責任を負います。",
        },
        {
          en: "4. Events & Content",
          ja: "第4条（イベント・コンテンツ）",
          bodyEn:
            "Event organizers are solely responsible for the accuracy of event information. The platform does not guarantee the quality, safety, or legality of any events listed.",
          bodyJa:
            "イベント主催者は、イベント情報の正確性について単独で責任を負います。本プラットフォームは、掲載されるイベントの品質、安全性、または合法性を保証しません。",
        },
        {
          en: "5. Disclaimer of Liability",
          ja: "第5条（免責事項）",
          bodyEn:
            "This platform is provided 'as is' without warranties of any kind. We are not liable for any damages arising from the use of this service, including but not limited to direct, indirect, or consequential damages.",
          bodyJa:
            "本プラットフォームは「現状のまま」提供され、いかなる種類の保証もありません。直接的、間接的、または結果的な損害を含む、本サービスの利用から生じる損害について、当社は責任を負いません。",
        },
        {
          en: "6. Privacy",
          ja: "第6条（プライバシー）",
          bodyEn:
            "We collect and process personal data in accordance with our Privacy Policy. By using this service, you consent to such processing.",
          bodyJa:
            "当社は、プライバシーポリシーに従って個人データを収集・処理します。本サービスを利用することで、かかる処理に同意したものとみなします。",
        },
        {
          en: "7. Changes to Terms",
          ja: "第7条（規約の変更）",
          bodyEn:
            "We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.",
          bodyJa:
            "当社はいつでも本規約を変更する権利を留保します。変更後もサービスを継続して利用した場合、新しい規約に同意したものとみなします。",
        },
        {
          en: "8. Governing Law",
          ja: "第8条（準拠法）",
          bodyEn:
            "These terms are governed by the laws of Japan. Any disputes shall be subject to the exclusive jurisdiction of the courts of Japan.",
          bodyJa:
            "本規約は日本法に準拠します。紛争が生じた場合は、日本の裁判所が専属管轄権を有します。",
        },
      ].map((section) => (
        <div key={section.en} style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 8 }}>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--accent-bright)",
              }}
            >
              {section.en}
            </h3>
            <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
              {section.ja}
            </p>
          </div>
          <p
            style={{
              fontSize: 12,
              color: "var(--fg-secondary)",
              lineHeight: 1.8,
              marginBottom: 6,
            }}
          >
            {section.bodyEn}
          </p>
          <p
            style={{ fontSize: 11, color: "var(--fg-muted)", lineHeight: 1.8 }}
          >
            {section.bodyJa}
          </p>
        </div>
      ))}

      <div
        style={{
          padding: "14px",
          marginTop: 8,
          background: "rgba(248,113,113,0.06)",
          border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <p style={{ fontSize: 11, color: "var(--red)", lineHeight: 1.7 }}>
          This document is a placeholder for prototype purposes and does not
          constitute a legally binding agreement. Please consult a legal
          professional before publishing.
        </p>
        <p
          style={{
            fontSize: 11,
            color: "var(--fg-muted)",
            lineHeight: 1.7,
            marginTop: 6,
          }}
        >
          本書はプロトタイプ用の仮文書であり、法的拘束力を持つものではありません。公開前に法律の専門家にご相談ください。
        </p>
      </div>
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────

const menuItems: { id: Page; en: string; ja: string; icon: string }[] = [
  { id: "company", en: "Company Info", ja: "会社情報", icon: "🏢" },
  { id: "about", en: "About Us", ja: "私たちについて", icon: "👥" },
  { id: "contact", en: "Contact", ja: "お問い合わせ", icon: "✉️" },
  { id: "faq", en: "FAQ", ja: "よくある質問", icon: "❓" },
  { id: "terms", en: "Terms & Disclaimer", ja: "利用規約・免責", icon: "📋" },
];

export default function InfoModal({ open, onClose }: Props) {
  const [activePage, setActivePage] = useState<Page>(null);

  if (!open) return null;

  const renderPage = () => {
    switch (activePage) {
      case "company":
        return <CompanyPage />;
      case "about":
        return <AboutPage />;
      case "contact":
        return <ContactPage />;
      case "faq":
        return <FAQPage />;
      case "terms":
        return <TermsPage />;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={() => {
        if (!activePage) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(5,5,10,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: activePage ? 560 : 420,
          maxHeight: "88vh",
          background: "var(--bg-layer2)",
          border: "1px solid var(--border-glow)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 60px var(--accent-glow)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "max-width 0.3s ease",
          position: "relative",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: -60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          {activePage && (
            <button
              onClick={() => setActivePage(null)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "var(--bg-glass)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--fg-muted)",
                flexShrink: 0,
                fontSize: 16,
              }}
            >
              ←
            </button>
          )}
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--fg-primary)",
              }}
            >
              {activePage
                ? menuItems.find((m) => m.id === activePage)?.en
                : "MESP"}
            </p>
            <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
              {activePage
                ? menuItems.find((m) => m.id === activePage)?.ja
                : "Modular Event Social Platform"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--fg-muted)",
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {!activePage ? (
            // Menu list
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "#f5f0e8",
                    border: "1px solid var(--border)",
                    margin: "0 auto 12px",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  <img
                    src="/tenjinshosai.png"
                    alt="天神書齋"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      padding: 4,
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--fg-primary)",
                    marginBottom: 2,
                    fontFamily: "'Noto Serif JP', serif",
                  }}
                >
                  天神書齋
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--fg-muted)",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  Tenjin Shosai
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--fg-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  Connecting people through events and culture.
                  <br />
                  <span style={{ fontSize: 11 }}>
                    イベントと文化で人々をつなぐプラットフォーム。
                  </span>
                </p>
              </div>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    background: "var(--bg-glass)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-hover)";
                    e.currentTarget.style.background = "rgba(139,92,246,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--bg-glass)";
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--fg-primary)",
                      }}
                    >
                      {item.en}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
                      {item.ja}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    style={{ color: "var(--fg-muted)", flexShrink: 0 }}
                  />
                </button>
              ))}
            </div>
          ) : (
            renderPage()
          )}
        </div>
      </div>
    </div>
  );
}
