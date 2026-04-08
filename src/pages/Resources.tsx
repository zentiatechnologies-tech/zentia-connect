import { useState } from "react";
import { ExternalLink, FileText, BookOpen, Video, Download } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactDialog from "@/components/ContactDialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const resources = [
  {
    title: "AI Implementation Guide for African Businesses",
    description: "A step-by-step guide to integrating AI solutions into your business operations.",
    category: "Guide",
    icon: BookOpen,
    type: "Free",
    link: "#",
  },
  {
    title: "Business Process Automation Checklist",
    description: "Identify which processes in your organisation are ready for AI-driven automation.",
    category: "Template",
    icon: FileText,
    type: "Free",
    link: "#",
  },
  {
    title: "Introduction to AI for Decision Makers",
    description: "A concise overview of AI capabilities and how they translate to business value.",
    category: "Whitepaper",
    icon: FileText,
    type: "Free",
    link: "#",
  },
  {
    title: "Data Readiness Assessment Template",
    description: "Evaluate whether your data infrastructure is prepared for AI integration.",
    category: "Template",
    icon: FileText,
    type: "Free",
    link: "#",
  },
  {
    title: "AI Use Cases Across African Industries",
    description: "Real-world examples of AI driving results in agriculture, finance, healthcare and more.",
    category: "Case Study",
    icon: BookOpen,
    type: "Free",
    link: "#",
  },
  {
    title: "Getting Started with Zentia — Video Walkthrough",
    description: "Watch how Zentia helps businesses deploy AI solutions quickly and effectively.",
    category: "Video",
    icon: Video,
    type: "Free",
    link: "#",
  },
];

const groups = [
  { label: "Guides", items: resources.filter(r => r.category === "Guide" || r.category === "Whitepaper" || r.category === "Case Study") },
  { label: "Templates", items: resources.filter(r => r.category === "Template") },
  { label: "Resources", items: resources.filter(r => r.category === "Video") },
];

const Resources = () => {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar onGetInTouch={() => setContactOpen(true)} />

      <main className="flex-1 pt-24 md:pt-32 pb-20">
        <div className="container">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            Resources
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mb-12">
            Free guides, templates, and tools to help you leverage AI for your business.
          </p>

          {groups.map((group) => (
            <section key={group.label} className="mb-14">
              <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-6 border-b border-border/60 pb-3">
                {group.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((resource, index) => (
                  <Card key={index} className="flex flex-col bg-card/60 backdrop-blur border-border/60 hover:border-primary/40 transition-colors duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {resource.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-primary border-primary/40">
                          {resource.type}
                        </Badge>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                          <resource.icon className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-lg leading-snug">{resource.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <CardDescription className="text-sm leading-relaxed">
                        {resource.description}
                      </CardDescription>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <a href={resource.link} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                          Download
                          <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              All resources are hosted on Google Drive. More coming soon!
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
};

export default Resources;
