---
name: voiceover
description: Adding AI-generated voiceover to Remotion compositions using TTS
metadata:
  tags: voiceover, audio, elevenlabs, tts, speech, calculateMetadata, dynamic duration
---

# Adding AI voiceover to a Remotion composition

> **⚠️ 核心约束 — 必须先精确测量音频时长，再写代码。** 严禁用手动 CBR 推算或文件大小估算时长。

## 前置步骤：精确测量音频时长（必须先做）

无论使用哪种 TTS 服务，生成 MP3 后 **第一步必须是测量精确时长**，而不是凭经验估算。  
VBR（可变码率）MP3 的文件大小与时长无线性关系，用手算会导致画面与声音严重不同步。

### 找 ffprobe 工具

Remotion 已自带 ffprobe，位置在 `node_modules/@remotion/compositor-*/ffprobe.exe`（或对应平台的二进制）。

### 测量命令

```bash
node -e "
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffprobe = 'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe';
// Linux/macOS 用: 'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'
const dir = 'public/voiceover';
for (const f of fs.readdirSync(dir).sort()) {
  const out = execSync(JSON.stringify(ffprobe) + ' -v quiet -print_format json -show_entries format=duration ' + JSON.stringify(path.join(dir, f)));
  const dur = JSON.parse(out.toString()).format.duration;
  console.log(f + ': ' + parseFloat(dur).toFixed(2) + 's = ' + Math.ceil(dur * 30) + ' frames');
}
"
```

### 应用到场景数据

```ts
const AUDIO_DURATIONS: Record<string, number> = {
  "scene1-intro": 11.35,   // ← 从 ffprobe 输出直接填入，禁止估算！
  "scene2-main": 15.34,
};

function scene(id: string, text: string, phrases: string[]): SceneData {
  const durSec = AUDIO_DURATIONS[id];
  return {
    id,
    durationFrames: Math.ceil(durSec * FPS) + 20, // +20帧（~0.67s）缓冲
    // ...
  };
}
```

## 中文配音：多音字处理（重要）

中文 TTS（尤其是 edge-tts / ElevenLabs）遇到多音字可能读错，**必须系统性地检查并消歧**。  
常用多音字约 **200+ 组**，只凭记忆或碰运气是不够的，需要工具辅助。

### 快速自查脚本

生成配音文案后，先用 Python 扫描出所有潜在的多音字，再逐个判断是否需要消歧：

```python
# check_polyphone.py — 扫描配音文案中的多音字
POLYPHONES = {
    "行": [("háng", "银行、行业、排行"), ("xíng", "行走、行动、进行")],
    "重": [("zhòng", "重要、严重、重量"), ("chóng", "重复、重新、重叠")],
    "得": [("dé", "得到、获得"), ("de", "跑得快、说得对"), ("děi", "非得、总得")],
    "乐": [("lè", "快乐、乐趣"), ("yuè", "音乐、乐器")],
    "角": [("jué", "角色、主角"), ("jiǎo", "角度、角落")],
    "调": [("diào", "调查、音调、步调"), ("tiáo", "调整、调节、调味")],
    "长": [("cháng", "长度、长期、特长"), ("zhǎng", "长大、校长、增长")],
    "为": [("wèi", "因为、为什么"), ("wéi", "作为、成为、认为")],
    "和": [("hé", "和平、和谐"), ("hè", "唱和、附和"), ("huó", "和面"), ("huo", "暖和、软和")],
    "还": [("hái", "还有、还是"), ("huán", "还钱、归还")],
    "着": [("zhe", "看着、说着"), ("zháo", "着急、着火"), ("zhuó", "着装、着手")],
    "相": [("xiāng", "相信、相互、相当"), ("xiàng", "照相、相片、真相")],
    "兴": [("xīng", "兴起、兴奋"), ("xìng", "高兴、兴趣")],
    "应": [("yīng", "应该、应当"), ("yìng", "应用、反应、应对")],
    "教": [("jiào", "教育、教师"), ("jiāo", "教书")],
    "假": [("jiǎ", "假如、假设"), ("jià", "放假、假期")],
    "间": [("jiān", "时间、之间"), ("jiàn", "间隔、间接")],
    "强": [("qiáng", "强大、加强"), ("qiǎng", "勉强、强迫")],
    "率": [("lǜ", "效率、概率、汇率"), ("shuài", "率领、表率")],
    "数": [("shù", "数学、数量、数据"), ("shǔ", "数一数、数不清")],
    "省": [("shěng", "省份、节省"), ("xǐng", "反省、不省人事")],
    "处": [("chù", "处所、处长"), ("chǔ", "处理、相处、处罚")],
    "传": [("chuán", "传递、传播、传统"), ("zhuàn", "传记、自传")],
    "倒": [("dǎo", "倒下、摔倒、倒闭"), ("dào", "倒退、倒影、倒车")],
    "发": [("fā", "发展、发现、发布"), ("fà", "头发、发型")],
    "分": [("fēn", "分开、分数、分析"), ("fèn", "本分、成分、水分")],
    "干": [("gàn", "干活、干部、才干"), ("gān", "干燥、干扰、干净")],
    "给": [("gěi", "送给、交给"), ("jǐ", "给予、供给、配给")],
    "当": [("dāng", "当时、应当、相当"), ("dàng", "当真、当做、恰当")],
    "的": [("de", "我的、美丽的"), ("dì", "目的、的确")],  # edge-tts 常把"目的"读错
    "好": [("hǎo", "好人、好的"), ("hào", "好奇、爱好、好客")],
    "看": [("kàn", "看见、观看"), ("kān", "看守、看管")],
    "空": [("kōng", "空气、空间、天空"), ("kòng", "空闲、空白、空缺")],
    "落": [("luò", "落后、降落、落实"), ("lào", "落下")],
    "模": [("mó", "模型、模式、模仿"), ("mú", "模样、模具")],
    "难": [("nán", "困难、难过、难题"), ("nàn", "灾难、遇难")],
    "宁": [("níng", "宁静、安宁"), ("nìng", "宁愿、宁可")],
    "切": [("qiē", "切开、切割"), ("qiè", "一切、切实、亲切")],
    "少": [("shǎo", "多少、少量"), ("shào", "少年、少女")],
    "中": [("zhōng", "中国、中间"), ("zhòng", "中奖、中毒、看中")],
    "种": [("zhǒng", "种子、种类、品种"), ("zhòng", "种田、种植")],
    "朝": [("cháo", "朝代、朝向"), ("zhāo", "朝阳、朝霞")],
    "称": [("chēng", "称呼、称号、称赞"), ("chèn", "称心、对称")],
    "恶": [("è", "恶劣、罪恶"), ("wù", "厌恶、可恶")],
    "更": [("gèng", "更加、更好"), ("gēng", "更新、更改、变更")],
    "参": [("cān", "参加、参与、参考"), ("shēn", "人参"), ("cēn", "参差")],
    "量": [("liàng", "数量、力量、重量"), ("liáng", "测量、量杯")],
    "了": [("le", "走了、说了"), ("liǎo", "了解、了结")],
    "累": [("lèi", "劳累、累人"), ("léi", "累赘"), ("lěi", "积累、累计")],
    "吓": [("xià", "吓人、吓一跳"), ("hè", "恐吓、威吓")],
    "盛": [("shèng", "盛开、盛大、茂盛"), ("chéng", "盛饭")],
}

import sys, re

with open(sys.argv[1], "r", encoding="utf-8") as f:
    text = f.read()

found = set()
for char in text:
    if char in POLYPHONES:
        found.add(char)

if found:
    print("⚠️  文案中含多音字，请人工确认读音：")
    for c in sorted(found):
        readings = "; ".join([f"{v[0]}（{v[1]}）" for v in POLYPHONES[c]])
        print(f"  「{c}」 → {readings}")
else:
    print("✅ 未发现常见多音字")
```

使用：`python check_polyphone.py 配音文案.txt`，然后逐字检查。

### 消歧方法（按优先级）

**方法一：上下文集消歧（首选）**  
TTS（尤其是 edge-tts）会通过上下文自动判断读音，写完整的句子一般能正确。  
例："角色"→ TTS 通常会自动读 jué；"调查"→ 自动读 diào。

**方法二：同义词替换**  
遇到 TTS 频繁读错的多音字时，换个词：  
| 原词 | 替换方案 |
|------|---------|
| 角色 → 误读为 jiǎo | 改"演员/人物/剧中人"或扩句为"剧中角色" |
| 调查 → 可能读 tiáo | 改"调研/考察" |
| 目的 → 可能读 de | 强调"目标" |
| 兴奋 → 可能读 xìng 奋 | 改"激动/振奋" |
| 效率 → 可能率读 shuài | 改"效能/产出" |

**方法三：拼音注音法（边缘 TTS 推荐）**  
在易错字后加括号拼音注音，TTS 读到时自动纠正：  
> 脚色(jué)的塑造很成功。  
> 调(diào)查结果显示。  
> 目(mù)标明确，效率(lǜ)很高。

注：注音字本身不应是易错多音字。

**方法四：文案分词法**  
对于"目的"这种有歧义的词，扩写成"目的目标"或"目的(de)"辅助 TTS 理解。

**方法五：生成后必听校验**  
1. 生成完整 MP3 后**从头到尾听一遍**  
2. 发现读错，找到对应原文位置  
3. 用上述方法修正后重新生成  
4. 重点排查方向：数字、单位、人名、专业术语

> **💡 经验原则：** 即使做了所有预处理，也**必须听一遍完整配音**才能上线。大部分多音字 TTS 能正确处理，出错的往往是少数意外情况，凭统计表预测不如实际听一遍可靠。  
避免有歧义的字。例："角色"→"演员"，"调整"→"调节"

**方法三：SSML 注音（仅边缘 TTS 部分支持）**  
```xml
<phoneme alphabet="py" ph="jue2 se4">角色</phoneme>
```

**方法四：在文案中用拼音标注**  
在难以消歧的词后加括号拼音，然后后期剪掉拼音部分。  
例："更新(gēng xīn)了版本"

### 生成后必须人工检查
1. 听一遍完整的 TTS 输出
2. 标记读错的多音字
3. 用上述方法修正后重新生成

---

## TTS 服务选择

| 服务 | 优点 | 缺点 | 费用 |
|------|------|------|------|
| edge-tts | 免费，中文语音质量好，无需 API Key | VBR 输出，需 ffprobe 精确测时长 | 免费 |
| ElevenLabs | 多语言，可调参数多 | 需 API Key，中文语音有限 | 付费 |
| Google TTS | 中文稳定 | 需 API Key | 付费 |

**推荐：** 无预算限制用 ElevenLabs；免费方案用 edge-tts（使用 `zh-CN-XiaoxiaoNeural` 女声效果最佳）。

### Python edge-tts 生成脚本示例

```python
import asyncio
import edge_tts

VOICE = "zh-CN-XiaoxiaoNeural"

async def gen():
    scenes = [
        {"id": "scene1", "text": "你的中文配音文案"},
    ]
    for s in scenes:
        await edge_tts.Communicate(s["text"], VOICE).save(f"public/voiceover/{s['id']}.mp3")

asyncio.run(gen())
```

---

## 字幕时间码对齐 — 推荐方案：逐条独立音频 + ffprobe 精确测量

### 方案对比

| 方案 | 精度 | 漂移 | 推荐度 |
|------|------|------|--------|
| **A. 逐条独立音频**（推荐） | 零误差 | 无 | ⭐⭐⭐⭐⭐ |
| B. 语速估算归一化（备选） | ±5%~15% | 少量 | ⭐⭐⭐ |

**方案 A 是黄金标准**：每条字幕短语生成独立的音频文件，用 ffprobe 分别测量时长，时间码直接来自音频本身。没有任何估算，后半段不会漂移。

---

### 方案 A：逐条独立音频（推荐）

#### 第一步：每条字幕生成独立音频文件

```python
# generate-voiceover.py
import asyncio, edge_tts

VOICE = "zh-CN-XiaoxiaoNeural"

scenes = [
    {
        "id": "scene1",
        "phrases": [
            "这里是第一条字幕的文案。",
            "这里是第二条字幕的文案。",
            "这里是第三条字幕的文案。",
        ],
    },
    # ...
]

async def gen():
    for scene in scenes:
        for i, phrase in enumerate(scene["phrases"]):
            filename = f"voiceover/{scene['id']}_p{i}.mp3"
            await edge_tts.Communicate(phrase, VOICE).save(f"public/{filename}")

asyncio.run(gen())
```

#### 第二步：用 ffprobe 精确测量每条音频

```bash
# 先用 Remotion 自带的 ffprobe 测每条音频的时长
node -e "
const { execSync } = require('child_process');
const ffprobe = 'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe';
// 对每条 p0.mp3, p1.mp3, ... 运行：
const out = execSync(JSON.stringify(ffprobe) + ' -v quiet -print_format json -show_entries format=duration ' + JSON.stringify('public/voiceover/scene1_p0.mp3'));
const dur = parseFloat(JSON.parse(out.toString()).format.duration);
console.log(dur); // 精确秒数
"
```

#### 第三步：构建字幕数据

每条字幕的 `startMs` 和 `endMs` **直接来自对应音频文件的 ffprobe 测量值**：

```ts
// sceneData.ts — 精确数据，零估算
const SCENES = [
  {
    id: "scene1",
    durationFrames: Math.ceil(totalMs / 1000 * 30) + 20, // +20帧缓冲
    subtitles: [
      // startMs/endMs 来自对应 p0.mp3 的 ffprobe 测量
      { text: "第一条字幕", startMs: 0,     endMs: 2664,  audioFile: "voiceover/scene1_p0.mp3" },
      { text: "第二条字幕", startMs: 2664,  endMs: 6288,  audioFile: "voiceover/scene1_p1.mp3" },
      { text: "第三条字幕", startMs: 6288,  endMs: 11064, audioFile: "voiceover/scene1_p2.mp3" },
    ],
  },
];
```

#### 第四步：在组件中精确播放

每个音频文件通过 `<Sequence from={...}>` 在正确的帧位置播放：

```tsx
// 在场景 Sequence 内部：
{s.subtitles.map((sub, j) => {
  const startFrame = Math.round(sub.startMs / 1000 * fps);
  return (
    <Sequence key={j} from={startFrame} durationInFrames={Math.ceil((sub.endMs - sub.startMs) / 1000 * fps)} layout="none">
      <Audio src={staticFile(sub.audioFile)} />
    </Sequence>
  );
})}
```

**关键：** 所有音频文件在场景开头就通过 `<Sequence>` 延迟启动，不需要手动控制播放时机。

#### 第五步：字幕显示

```ts
// 根据当前帧找到正在播放的字幕
function getActiveSubtitle(frame: number, fps: number, si: number): Subtitle | null {
  const ms = (frame / fps) * 1000;
  for (const sub of SCENES[si].subtitles) {
    if (ms >= sub.startMs && ms <= sub.endMs) return sub;
  }
  return null;
}
```

字幕条的透明度**只淡入一次**，不循环重置：
```tsx
const a = interpolate(Math.min(frame, 20), [0, 8], [0, 1], { extrapolateRight: "clamp" });
```

---

### 方案 B：语速估算归一化（备选，仅当不能拆分为独立音频时使用）

当无法生成独立音频文件时，用此方法估算。精度低于方案 A，可能出现后半段漂移。

```ts
function buildCaptions(text: string, totalMs: number, phrases: string[]) {
  const SPEAK_RATE = 4.5; // 中文语速 字/秒
  const rawDurs = phrases.map((p) => (p.length / SPEAK_RATE) * 1000);
  const rawTotal = rawDurs.reduce((a, b) => a + b, 0);
  const normDurs = rawDurs.map((d) => (d / rawTotal) * totalMs);
  const result: { text: string; startMs: number; endMs: number }[] = [];
  let cur = 0;
  for (let i = 0; i < phrases.length; i++) {
    const end = cur + normDurs[i];
    result.push({ text: phrases[i], startMs: Math.round(cur), endMs: Math.round(end) });
    cur = end;
  }
  if (result.length > 0) result[result.length - 1].endMs += 600;
  for (let i = 1; i < result.length; i++) {
    result[i].startMs = Math.min(result[i].endMs - 100, result[i].startMs + 120);
  }
  return result;
}
```

> ⚠️ **方案 B 禁止**使用 `cur += xxx` 累积变量然后直接取整作为 startMs。必须先归一化再积累。

---



## Dynamic composition duration with calculateMetadata

Use [`calculateMetadata`](./calculate-metadata.md) to measure the [audio durations](./get-audio-duration.md) and set the composition length accordingly.

```tsx
import { CalculateMetadataFunction, staticFile } from "remotion";
import { getAudioDuration } from "./get-audio-duration";

const FPS = 30;

const SCENE_AUDIO_FILES = [
  "voiceover/my-comp/scene-01-intro.mp3",
  "voiceover/my-comp/scene-02-main.mp3",
  "voiceover/my-comp/scene-03-outro.mp3",
];

export const calculateMetadata: CalculateMetadataFunction<Props> = async ({
  props,
}) => {
  const durations = await Promise.all(
    SCENE_AUDIO_FILES.map((file) => getAudioDuration(staticFile(file))),
  );

  const sceneDurations = durations.map((durationInSeconds) => {
    return durationInSeconds * FPS;
  });

  return {
    durationInFrames: Math.ceil(sceneDurations.reduce((sum, d) => sum + d, 0)),
  };
};
```

The computed `sceneDurations` are passed into the component via a `voiceover` prop so the component knows how long each scene should be.

If the composition uses [`<TransitionSeries>`](./transitions.md), subtract the overlap from total duration: [./transitions.md#calculating-total-composition-duration](./transitions.md#calculating-total-composition-duration)

## Rendering audio in the component

See [audio.md](./audio.md) for more information on how to render audio in the component.

## Delaying audio start

See [audio.md#delaying](./audio.md#delaying) for more information on how to delay the audio start.
