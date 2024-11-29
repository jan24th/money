"use client";

import { Button } from "@/components/ui/button";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  InlineFormItem,
  SubmitButton,
} from "@/components/ui/form";
import {
  AccountItem,
  BILL,
  BillItem,
  CategoryItem,
  CategoryType,
  newBillSchema,
} from "types";
import { useToast } from "@/lib/use-toast";
import DrawerDialog from "@/components/ui/DrawerDialog";
import { ComponentProps, useState } from "react";
import { CalendarIcon, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  StepperContent,
  StepperList,
  StepperRoot,
  StepperTrigger,
  useStepper,
} from "@/components/ui/stepper";
import { Label } from "@/components/ui/label";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Money } from "@/components/ui/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input, MoneyInput } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import dayjs from "dayjs";
import { add, redirectList } from "@/components/form/add-bill.action";

function AccountStep({
  onAccount,
  accounts,
  account,
}: {
  account: string;
  onAccount: (account: string) => void;
  accounts: AccountItem[];
}) {
  const { onNext } = useStepper();
  return (
    <ScrollArea className={cn("mt-4 h-60", accounts.length > 6 ? "h-60" : "")}>
      <RadioGroupPrimitive.Root
        value={account}
        onValueChange={(value) => onAccount(value)}
        className="grid pr-2"
      >
        {accounts.map((i) => (
          <div
            key={i.id}
            className={cn(
              "w-full flex px-2 border-b last:border-b-transparent border-t hover:bg-accent relative",
            )}
          >
            <RadioGroupPrimitive.Item
              id={`account_${i.id}`}
              value={i.id}
              key={i.id}
              onClick={() => onNext()}
            >
              <RadioGroupPrimitive.Indicator className="absolute inset-0 border border-primary" />
            </RadioGroupPrimitive.Item>
            <Label
              htmlFor={`account_${i.id}`}
              className="cursor-pointer my-1 w-full flex justify-between py-2"
            >
              <div>{i.name}</div>
              <Money value={i.value} />
            </Label>
          </div>
        ))}
      </RadioGroupPrimitive.Root>
      <ScrollBar />
    </ScrollArea>
  );
}
function CategoryStep({
  category,
  onCategory,
  categories,
}: {
  category: string;
  onCategory: (account: string) => void;
  categories: CategoryItem[];
}) {
  const { onNext, onPrev } = useStepper();

  return (
    <>
      <RadioGroupPrimitive.Root
        value={category}
        onValueChange={(value) => onCategory(value)}
      >
        <Tabs
          defaultValue={
            categories.find((i) => i.id === category)?.type ||
            CategoryType.EXPENSES
          }
        >
          <TabsList className="w-full">
            {[CategoryType.EXPENSES, CategoryType.INCOME].map((type) => (
              <TabsTrigger className="flex-1" value={type} key={type}>
                {type}
              </TabsTrigger>
            ))}
          </TabsList>
          {[CategoryType.EXPENSES, CategoryType.INCOME].map((type) => (
            <TabsContent value={type} key={type}>
              <ScrollArea className={cn("my-4 h-36")}>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                  {categories
                    .filter((i) => i.type === type)
                    .map((i) => (
                      <div
                        key={i.id}
                        className={cn(
                          "w-full flex border items-center justify-center hover:bg-accent relative",
                        )}
                      >
                        <RadioGroupPrimitive.Item
                          id={`category_${i.id}`}
                          value={i.id}
                          key={i.id}
                          onClick={() => onNext()}
                        >
                          <RadioGroupPrimitive.Indicator className="absolute inset-0 border border-primary" />
                        </RadioGroupPrimitive.Item>
                        <Label
                          htmlFor={`category_${i.id}`}
                          className="cursor-pointer my-1 w-full flex justify-center py-2"
                        >
                          <div>{i.value}</div>
                        </Label>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </RadioGroupPrimitive.Root>
      <Button onClick={onPrev} className="w-full">
        Back to account
      </Button>
    </>
  );
}
function BillStep({
  defaultValues,
  setOpen,
  categories,
  accounts,
}: ComponentProps<typeof AddBillForm> & {
  defaultValues: Omit<BillItem, "id" | "active">;
}) {
  const { toast } = useToast();
  const form = useForm<Omit<BillItem, "id" | "active">>({
    resolver: zodResolver(newBillSchema()),
    defaultValues,
  });
  const query = useSearchParams();
  async function onSubmit(data: Omit<BillItem, "id" | "active">) {
    setOpen(false);
    form.reset();
    const res = await add(data);
    switch (res?.at(0)) {
      case BILL.UNKNOWN: {
        form.setError("value", { message: res.at(1) });
        break;
      }
    }
    if (!res) {
      setOpen(false);
      form.reset();
      toast({ description: "Add bill" });
      await redirectList(query);
    }
  }
  return (
    <Form {...form}>
      <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="account"
          render={({ field }) => (
            <InlineFormItem label="Account">
              <Select
                disabled
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InlineFormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <InlineFormItem label="Category">
              <Select
                disabled
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InlineFormItem>
          )}
        />
        <FormField
          control={form.control}
          name="desc"
          render={({ field }) => (
            <InlineFormItem label="Desc">
              <Input {...field} />
            </InlineFormItem>
          )}
        />
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <InlineFormItem label="Value">
              <MoneyInput {...field} />
            </InlineFormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <InlineFormItem label="Time">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal w-full",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        dayjs(field.value).format("YYYY-MM-DD")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(field.value)}
                    onSelect={(v) => field.onChange(dayjs(v).toISOString())}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </InlineFormItem>
          )}
        />
        <SubmitButton />
      </form>
    </Form>
  );
}

function AddBillForm(
  props: ComponentProps<ComponentProps<typeof DrawerDialog>["Body"]> & {
    accounts: AccountItem[];
    categories: CategoryItem[];
  },
) {
  const query = useSearchParams();
  const [account, setAccount] = useState(query.getAll("account")?.at(0) || "");
  const [category, setCategory] = useState(
    query.getAll("category")?.at(0) || "",
  );
  return (
    <StepperRoot defaultValue={1}>
      <StepperList>
        <StepperTrigger value={1}>Account</StepperTrigger>
        <StepperTrigger value={2}>Category</StepperTrigger>
        <StepperTrigger value={3}>Bill</StepperTrigger>
      </StepperList>
      <StepperContent value={1}>
        <AccountStep
          account={account}
          onAccount={(account) => setAccount(account)}
          accounts={props.accounts}
        />
      </StepperContent>
      <StepperContent value={2}>
        <CategoryStep
          category={category}
          onCategory={(category) => setCategory(category)}
          categories={props.categories}
        />
      </StepperContent>
      <StepperContent value={3}>
        <BillStep
          {...props}
          defaultValues={{
            desc: "",
            value: 0,
            date: new Date().toISOString(),
            account,
            category,
          }}
        />
      </StepperContent>
    </StepperRoot>
  );
}
export default function AddBill({
  accounts,
  categories,
}: {
  accounts: AccountItem[];
  categories: CategoryItem[];
}) {
  return (
    <DrawerDialog
      title={"Add"}
      trigger={
        <Button size="sm">
          <Plus />
        </Button>
      }
      Body={(props) => (
        <AddBillForm accounts={accounts} categories={categories} {...props} />
      )}
    />
  );
}