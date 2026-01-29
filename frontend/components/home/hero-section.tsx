export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
      <div className="w-full px-4 text-center sm:px-6">
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">国会の動きを、わかりやすく</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          国会議事録をAIでかみ砕き、わかりやすい言葉で要約します。<br></br>
          誰が何を言ったかに焦点を当て、恣意的な印象操作のない、バランスのとれた政治ニュースを目指しています。<br></br>
          過去の議事録も順次AIで要約し、公開していきます。
        </p>
      </div>
    </section>
  )
}
