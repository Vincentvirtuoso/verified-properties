"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TableContextValue = {
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
};

const TableContext = React.createContext<TableContextValue>({});

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
}

export function Table({
  striped = false,
  hoverable = true,
  compact = false,
  className,
  children,
  ...props
}: TableProps) {
  return (
    <TableContext.Provider value={{ striped, hoverable, compact }}>
      <div className="w-full overflow-auto rounded-lg border border-border">
        <table
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        >
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />;
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  highlighted?: boolean;
}

export function TableRow({
  highlighted = false,
  className,
  ...props
}: TableRowProps) {
  const { striped, hoverable } = React.useContext(TableContext);

  return (
    <tr
      className={cn(
        "border-b border-border transition-colors",
        striped && "odd:bg-muted/10",
        hoverable && "hover:bg-muted/15",
        highlighted && "bg-primary/5 hover:bg-primary/10",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-10 px-4 text-left align-middle font-medium text-muted has-[[role=checkbox]]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  const { compact } = React.useContext(TableContext);

  return (
    <td
      className={cn(
        "px-4 align-middle has-[[role=checkbox]]:pr-0",
        compact ? "py-2" : "py-3",
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption className={cn("mt-4 text-sm text-muted", className)} {...props} />
  );
}

import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
} from "@/components/ui/Dropdown";
import { Spinner } from "./Spinner";
import { FiMoreHorizontal } from "react-icons/fi";

interface TableActionProps {
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
}

export function TableAction({
  children,
  loading = false,
  className,
  placement = "bottom-end",
}: TableActionProps) {
  return (
    <Dropdown placement={placement}>
      <DropdownTrigger
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-inverse transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        disabled={loading}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <FiMoreHorizontal className="h-4 w-4" />
        )}
      </DropdownTrigger>
      <DropdownContent className="w-50">{children}</DropdownContent>
    </Dropdown>
  );
}
