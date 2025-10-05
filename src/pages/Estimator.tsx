import { useState } from "react";
import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Calculator } from "lucide-react";

interface Semester {
  id: number;
  gpa: string;
  credits: string;
}

const Estimator = () => {
  const [semesters, setSemesters] = useState<Semester[]>([
    { id: 1, gpa: "", credits: "" },
  ]);
  const [cumulativeGPA, setCumulativeGPA] = useState<number | null>(null);
  const [estimatedGraduation, setEstimatedGraduation] = useState<string>("");

  const addSemester = () => {
    setSemesters([...semesters, { id: Date.now(), gpa: "", credits: "" }]);
  };

  const removeSemester = (id: number) => {
    setSemesters(semesters.filter((sem) => sem.id !== id));
  };

  const updateSemester = (id: number, field: "gpa" | "credits", value: string) => {
    setSemesters(
      semesters.map((sem) =>
        sem.id === id ? { ...sem, [field]: value } : sem
      )
    );
  };

  const calculate = () => {
    let totalPoints = 0;
    let totalCredits = 0;

    semesters.forEach((sem) => {
      const gpa = parseFloat(sem.gpa);
      const credits = parseFloat(sem.credits);
      if (!isNaN(gpa) && !isNaN(credits)) {
        totalPoints += gpa * credits;
        totalCredits += credits;
      }
    });

    if (totalCredits > 0) {
      const cgpa = totalPoints / totalCredits;
      setCumulativeGPA(parseFloat(cgpa.toFixed(2)));

      // Estimate graduation (assuming 130 credits needed, avg 18 credits/semester)
      const creditsRemaining = Math.max(0, 130 - totalCredits);
      const semestersRemaining = Math.ceil(creditsRemaining / 18);
      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() + semestersRemaining * 6);
      setEstimatedGraduation(currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
    }
  };

  return (
    <Layout>
      <div className="relative min-h-screen p-8">
        <DecorativeBackground />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-primary">GPA & Graduation Estimator</h1>
            <p className="text-muted-foreground mt-2">
              Calculate your cumulative GPA and estimate your graduation date
            </p>
          </div>

          {/* Input Card */}
          <Card className="border-2 border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Enter Semester Data</CardTitle>
              <CardDescription>Add your past semester GPAs and credit hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {semesters.map((semester, index) => (
                <div key={semester.id} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`gpa-${semester.id}`}>Semester {index + 1} GPA</Label>
                    <Input
                      id={`gpa-${semester.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      placeholder="3.50"
                      value={semester.gpa}
                      onChange={(e) => updateSemester(semester.id, "gpa", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`credits-${semester.id}`}>Credit Hours</Label>
                    <Input
                      id={`credits-${semester.id}`}
                      type="number"
                      step="1"
                      min="0"
                      placeholder="18"
                      value={semester.credits}
                      onChange={(e) => updateSemester(semester.id, "credits", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  {semesters.length > 1 && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeSemester(semester.id)}
                      className="rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  onClick={addSemester}
                  variant="outline"
                  className="rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Semester
                </Button>
                <Button
                  onClick={calculate}
                  className="rounded-xl bg-primary hover:bg-primary/90"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          {cumulativeGPA !== null && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur">
              <CardHeader>
                <CardTitle>Your Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-background/50 rounded-2xl p-6 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Cumulative GPA</p>
                    <p className="text-4xl font-bold text-primary">{cumulativeGPA}</p>
                  </div>
                  <div className="bg-background/50 rounded-2xl p-6 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Estimated Graduation</p>
                    <p className="text-2xl font-bold text-accent">{estimatedGraduation}</p>
                  </div>
                </div>
                <div className="bg-background/50 rounded-2xl p-4 border border-border">
                  <p className="text-sm text-muted-foreground">
                    Based on 130 total credits needed and average 18 credits per semester
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Estimator;
