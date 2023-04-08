// requires to import HTML or CSS as string
declare module '*.html' {
  const value: string;
  export default value;
}
declare module '*.css' {
  const value: string;
  export default value;
}
