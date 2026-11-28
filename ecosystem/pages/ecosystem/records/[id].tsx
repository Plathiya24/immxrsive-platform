import type { GetStaticPaths, GetStaticProps } from "next";
import { ecosystemEntities, entityById } from "../../../data/ecosystem";
import EcosystemPage from "../../ecosystem";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: ecosystemEntities.map(entity => ({ params: { id: entity.id } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<{ briefId: string }> = ({ params }) => {
  const id = params?.id;
  return typeof id === "string" && entityById.has(id)
    ? { props: { briefId: id } }
    : { notFound: true };
};

export default EcosystemPage;
